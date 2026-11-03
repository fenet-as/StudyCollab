import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { chatApi } from '../../../api/chatApi.js';
import { SERVER_BASE_URL } from '../../../api/config.js';

/**
 * Format ISO datetime string to localized "hh:mm AM/PM".
 * @param {string|Date} dateInput
 * @returns {string}
 */
export const formatMessageTimestamp = (dateInput) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Normalize backend ChatMessageResponseDTO to the representation expected by chat UI components.
 * @param {Object} dto
 * @param {number|string|null} currentUserId
 * @returns {Object}
 */
export const normalizeChatMessage = (dto, currentUserId) => {
  if (!dto) return null;

  const sender = dto.sender || {};
  const senderId = sender.id;
  const isMine = Boolean(
    currentUserId && senderId && String(currentUserId) === String(senderId)
  );

  const senderName = sender.name || 'Unknown';
  const senderInitials =
    senderName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

  const isDeleted = Boolean(dto.isDeleted);
  const content = isDeleted ? 'This message was deleted' : dto.content;

  return {
    id: dto.id,
    channelId: dto.channelId,
    content,
    senderId,
    senderName,
    senderAvatar: sender.avatarUrl || null,
    senderInitials,
    isMine,
    role: sender.groupRole || '',
    timestamp: formatMessageTimestamp(dto.createdAt),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    isEdited: Boolean(dto.updatedAt && dto.updatedAt !== dto.createdAt),
    pinned: Boolean(dto.isPinned),
    isPinned: Boolean(dto.isPinned),
    isDeleted,
    replyTo: dto.replyTo?.contentSnippet || null,
    replyToSenderName: dto.replyTo?.senderName || null,
    replyToId: dto.replyTo?.id || null,
    reactions: dto.reactions || [],
  };
};

/**
 * Build WebSocket URL for STOMP broker.
 * @returns {string}
 */
export const getWebSocketUrl = () => {
  const base =
    SERVER_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080');
  const wsProtocol = base.startsWith('https') ? 'wss:' : 'ws:';
  const cleanHost = base.replace(/^https?:\/\//, '');
  return `${wsProtocol}//${cleanHost}/ws`;
};

/**
 * Custom hook managing real-time chat lifecycle, message history, STOMP subscriptions,
 * and optimistic message actions for a study group channel.
 *
 * @param {Object} options
 * @param {number|string} options.groupId - Active study group ID
 * @param {number|string} options.channelId - Active channel ID
 * @param {Object} [options.currentUser] - Authenticated user profile { id, name, ... }
 * @returns {Object} Chat state and action handlers
 */
export function useChat({ groupId, channelId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const stompClientRef = useRef(null);
  const currentSubscriptionRef = useRef(null);

  const currentUserId = currentUser?.id || currentUser?.userId;

  // 1. Fetch initial message history on channel change
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setHasMore(false);
      setNextCursor(null);
      setLoadingHistory(false);
      return;
    }

    let isSubscribed = true;
    setLoadingHistory(true);
    setConnectionError(null);

    chatApi
      .getMessages(channelId, { limit: 50 })
      .then((data) => {
        if (!isSubscribed) return;
        const rawMessages = data.messages || [];
        // Backend returns descending (newest first); reverse to chronological [oldest -> newest] for feed
        const chronological = [...rawMessages]
          .reverse()
          .map((m) => normalizeChatMessage(m, currentUserId));

        setMessages(chronological);
        setHasMore(Boolean(data.hasMore));
        setNextCursor(data.nextCursor || null);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.error('Failed to load message history:', err);
        setConnectionError(err.message || 'Failed to load chat history');
      })
      .finally(() => {
        if (isSubscribed) {
          setLoadingHistory(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [channelId, currentUserId]);

  // 2. Setup STOMP WebSocket Client and Channel Subscription
  useEffect(() => {
    if (!groupId || !channelId) {
      return;
    }

    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

    const client = new Client({
      brokerURL: getWebSocketUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionError(null);

        // Subscribe to real-time events for this channel
        const topic = `/topic/group.${groupId}.channel.${channelId}`;
        const sub = client.subscribe(topic, (frame) => {
          try {
            const event = JSON.parse(frame.body);
            handleIncomingEvent(event);
          } catch (err) {
            console.error('Error parsing STOMP frame body:', err);
          }
        });

        currentSubscriptionRef.current = sub;
      },
      onStompError: (frame) => {
        console.error('STOMP protocol error:', frame.headers['message']);
        setIsConnected(false);
        setConnectionError(frame.headers['message'] || 'STOMP connection error');
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    stompClientRef.current = client;

    // Activate STOMP connection only in browser environment
    if (typeof WebSocket !== 'undefined' || typeof window !== 'undefined') {
      try {
        client.activate();
      } catch (err) {
        console.error('Failed to activate STOMP client:', err);
      }
    }

    return () => {
      if (currentSubscriptionRef.current) {
        try {
          currentSubscriptionRef.current.unsubscribe();
        } catch {
          // ignore cleanup errors
        }
        currentSubscriptionRef.current = null;
      }
      if (client) {
        try {
          client.deactivate();
        } catch {
          // ignore cleanup errors
        }
      }
      setIsConnected(false);
    };
  }, [groupId, channelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Dispatch incoming STOMP events to state
  const handleIncomingEvent = useCallback(
    (event) => {
      if (!event || !event.type) return;

      const { type, payload } = event;

      setMessages((prevMessages) => {
        switch (type) {
          case 'CHAT_MESSAGE': {
            const normalized = normalizeChatMessage(payload, currentUserId);
            if (!normalized) return prevMessages;

            // Check if this replaces an optimistic message (by temp id or exact pending match)
            const optimisticIndex = prevMessages.findIndex(
              (m) =>
                m.pending &&
                m.isMine &&
                m.content === normalized.content &&
                String(m.replyToId) === String(normalized.replyToId)
            );

            if (optimisticIndex !== -1) {
              const updated = [...prevMessages];
              updated[optimisticIndex] = normalized;
              return updated;
            }

            // Prevent duplicate message IDs
            if (prevMessages.some((m) => m.id === normalized.id)) {
              return prevMessages;
            }

            return [...prevMessages, normalized];
          }

          case 'MESSAGE_EDITED': {
            return prevMessages.map((msg) =>
              msg.id === payload.id
                ? {
                    ...msg,
                    content: payload.content,
                    updatedAt: payload.updatedAt,
                    isEdited: true,
                  }
                : msg
            );
          }

          case 'MESSAGE_DELETED': {
            return prevMessages.map((msg) =>
              msg.id === payload.id
                ? {
                    ...msg,
                    isDeleted: true,
                    content: 'This message was deleted',
                  }
                : msg
            );
          }

          case 'REACTION_UPDATED': {
            return prevMessages.map((msg) => {
              if (msg.id !== payload.messageId) return msg;

              // Compute reactedByMe for local current user
              const reactions = (payload.reactions || []).map((r) => ({
                emoji: r.emoji,
                count: r.count,
                reactedByMe: Boolean(r.reactedByMe),
              }));

              return {
                ...msg,
                reactions,
              };
            });
          }

          case 'PIN_UPDATED': {
            return prevMessages.map((msg) =>
              msg.id === payload.messageId
                ? {
                    ...msg,
                    pinned: Boolean(payload.isPinned),
                    isPinned: Boolean(payload.isPinned),
                  }
                : msg
            );
          }

          default:
            return prevMessages;
        }
      });
    },
    [currentUserId]
  );

  // 4. Load older messages via keyset pagination
  const loadMoreMessages = useCallback(async () => {
    if (!channelId || !hasMore || loadingMore || !nextCursor) {
      return;
    }

    setLoadingMore(true);
    try {
      const data = await chatApi.getMessages(channelId, {
        before: nextCursor,
        limit: 50,
      });

      const rawOlder = data.messages || [];
      const chronologicalOlder = [...rawOlder]
        .reverse()
        .map((m) => normalizeChatMessage(m, currentUserId));

      setMessages((prev) => [...chronologicalOlder, ...prev]);
      setHasMore(Boolean(data.hasMore));
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [channelId, hasMore, loadingMore, nextCursor, currentUserId]);

  // 5. Send message via STOMP with optimistic UI fallback
  const sendMessage = useCallback(
    (input) => {
      const payload = typeof input === 'string' ? { content: input } : (input || {});
      const { content, replyToId = null, replySnippet = null } = payload;
      if (!content || !content.trim() || !channelId || !groupId) return;

      const trimmedContent = content.trim();

      // Create optimistic preview message
      const optimisticMsg = {
        id: `optimistic-${Date.now()}-${Math.random()}`,
        channelId,
        content: trimmedContent,
        senderId: currentUserId,
        senderName: currentUser?.fullName || currentUser?.name || 'You',
        senderAvatar: currentUser?.avatarUrl || null,
        senderInitials:
          (currentUser?.fullName || currentUser?.name || 'Y')
            .split(' ')
            .filter(Boolean)
            .map((p) => p[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'Y',
        isMine: true,
        role: currentUser?.role || 'MEMBER',
        timestamp: formatMessageTimestamp(new Date()),
        createdAt: new Date().toISOString(),
        updatedAt: null,
        isEdited: false,
        pinned: false,
        isPinned: false,
        isDeleted: false,
        replyTo: replySnippet || null,
        replyToSenderName: null,
        replyToId: replyToId || null,
        reactions: [],
        pending: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      // Publish over STOMP
      if (stompClientRef.current && isConnected) {
        try {
          stompClientRef.current.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({
              groupId,
              channelId,
              content: trimmedContent,
              replyToId: replyToId || null,
            }),
          });
        } catch (err) {
          console.error('Failed to publish STOMP message:', err);
        }
      }
    },
    [channelId, groupId, currentUserId, currentUser, isConnected]
  );

  // 6. Edit message via STOMP
  const editMessage = useCallback(
    (messageId, newContent) => {
      if (!messageId || !newContent || !newContent.trim() || !channelId || !groupId) return;

      const trimmed = newContent.trim();

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: trimmed, updatedAt: new Date().toISOString(), isEdited: true }
            : m
        )
      );

      if (stompClientRef.current && isConnected) {
        try {
          stompClientRef.current.publish({
            destination: '/app/chat.edit',
            body: JSON.stringify({
              groupId,
              channelId,
              messageId,
              content: trimmed,
            }),
          });
        } catch (err) {
          console.error('Failed to publish STOMP edit:', err);
        }
      }
    },
    [channelId, groupId, isConnected]
  );

  // 7. Delete message via STOMP
  const deleteMessage = useCallback(
    (messageId) => {
      if (!messageId || !channelId || !groupId) return;

      // Optimistic soft-delete
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        )
      );

      if (stompClientRef.current && isConnected) {
        try {
          stompClientRef.current.publish({
            destination: '/app/chat.delete',
            body: JSON.stringify({
              groupId,
              channelId,
              messageId,
            }),
          });
        } catch (err) {
          console.error('Failed to publish STOMP delete:', err);
        }
      }
    },
    [channelId, groupId, isConnected]
  );

  // 8. React to message via STOMP
  const reactToMessage = useCallback(
    (messageId, emoji) => {
      if (!messageId || !emoji || !channelId || !groupId) return;

      if (stompClientRef.current && isConnected) {
        try {
          stompClientRef.current.publish({
            destination: '/app/chat.react',
            body: JSON.stringify({
              groupId,
              channelId,
              messageId,
              emoji,
            }),
          });
        } catch (err) {
          console.error('Failed to publish STOMP reaction:', err);
        }
      }
    },
    [channelId, groupId, isConnected]
  );

  // 9. Toggle pin status via REST API (which automatically broadcasts PIN_UPDATED)
  const togglePin = useCallback(
    async (messageId) => {
      const targetMsg = messages.find((m) => m.id === messageId);
      if (!targetMsg || !channelId) return;

      const newPinned = !targetMsg.pinned;

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, pinned: newPinned, isPinned: newPinned } : m
        )
      );

      try {
        await chatApi.pinMessage(channelId, messageId, newPinned);
      } catch (err) {
        console.error('Failed to update pinned status:', err);
        // Revert on error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, pinned: !newPinned, isPinned: !newPinned } : m
          )
        );
      }
    },
    [messages, channelId]
  );

  return {
    messages,
    loadingHistory,
    loadingMore,
    hasMore,
    nextCursor,
    isConnected,
    connectionError,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    togglePin,
    loadMoreMessages,
  };
}
