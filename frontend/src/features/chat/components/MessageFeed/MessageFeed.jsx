import React, { useEffect, useRef, useLayoutEffect } from "react";
import { Hash, Pin, X } from "lucide-react";
import MessageItem from "../MessageItem/MessageItem.jsx";
import styles from "./MessageFeed.module.css";

export default function MessageFeed({
  messages = [],
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  currentUserId,
  onAddReaction,
  onReply,
  onStartEdit,
  onRequestDeleteMessage,
  onTogglePin,
}) {
  const feedContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const prevMessagesLengthRef = useRef(messages.length);
  const isLoadingMoreRef = useRef(false);

  // Keep track of loadingMore transitions to restore scroll offset on prepend
  useEffect(() => {
    isLoadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  // Track if user is scrolled near bottom
  const handleScroll = () => {
    const container = feedContainerRef.current;
    if (!container) return;

    const threshold = 120;
    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceToBottom < threshold;

    // Optional trigger for top scroll
    if (
      container.scrollTop <= 10 &&
      hasMore &&
      !loadingMore &&
      typeof onLoadMore === "function"
    ) {
      onLoadMore();
    }
  };

  // Preserve scroll offset when older messages are prepended
  useLayoutEffect(() => {
    const container = feedContainerRef.current;
    if (!container) return;

    const prevLength = prevMessagesLengthRef.current;
    const currentLength = messages.length;

    if (currentLength > prevLength && container.scrollTop < 100) {
      // Prepending older messages
      const scrollDiff = container.scrollHeight - prevScrollHeightRef.current;
      if (scrollDiff > 0 && prevScrollHeightRef.current > 0) {
        container.scrollTop += scrollDiff;
      }
    } else if (currentLength > prevLength) {
      // New message appended at bottom
      const lastMsg = messages[messages.length - 1];
      const isMyMessage =
        lastMsg?.isMine || (currentUserId && lastMsg?.senderId === currentUserId);

      if (isNearBottomRef.current || isMyMessage) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    prevScrollHeightRef.current = container.scrollHeight;
    prevMessagesLengthRef.current = currentLength;
  }, [messages, currentUserId]);

  const handleScrollToMessage = (targetMessageId) => {
    if (!targetMessageId) return;
    const targetEl = document.getElementById(`msg-${targetMessageId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("highlight-msg");
      setTimeout(() => {
        targetEl.classList.remove("highlight-msg");
      }, 2000);
    }
  };

  const pinnedMessages = (messages || []).filter((m) => m && m.pinned);

  return (
    <div className={styles.feedWrapper}>
      {pinnedMessages.length > 0 && (
        <div className={styles.pinnedBar} aria-label="Pinned messages bar">
          <div className={styles.pinnedHeader}>
            <Pin size={14} className={styles.pinIcon} />
            <span>Pinned Messages ({pinnedMessages.length}):</span>
          </div>
          <div className={styles.pinnedList}>
            {pinnedMessages.map((pm) => (
              <div key={pm.id} className={styles.pinnedItem}>
                <button
                  type="button"
                  className={styles.pinnedText}
                  onClick={() => handleScrollToMessage(pm.id)}
                  title="Click to jump to message"
                  aria-label={`Jump to pinned message from ${pm.senderName}`}
                >
                  <strong>{pm.senderName}:</strong> "{pm.content}"
                </button>
                <button
                  className={styles.unpinBtn}
                  onClick={() => onTogglePin?.(pm.id)}
                  title="Unpin message"
                  aria-label={`Unpin message from ${pm.senderName}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={styles.messageFeed}
        ref={feedContainerRef}
        onScroll={handleScroll}
        data-testid="message-feed-container"
      >
        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={onLoadMore}
              disabled={loadingMore}
              aria-label="Load earlier messages"
            >
              {loadingMore ? "Loading earlier messages..." : "Load earlier messages"}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <Hash size={40} />
            <p>No messages here yet. Be the first to break the ice!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onAddReaction={onAddReaction}
              onReply={onReply}
              onStartEdit={onStartEdit}
              onRequestDelete={onRequestDeleteMessage}
              onTogglePin={onTogglePin}
              onScrollToMessage={handleScrollToMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} data-testid="message-feed-end" />
      </div>
    </div>
  );
}
