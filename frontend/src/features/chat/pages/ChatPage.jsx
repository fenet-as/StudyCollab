import React, { useState, useMemo } from 'react';
import { MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useGroupsContext } from '../../../context/useGroupsContext.js';
import { useAuthContext } from '../../../context/useAuthContext.js';
import { useChannels } from '../hooks/useChannels.js';
import { useChat } from '../hooks/useChat.js';

import ChannelList from '../components/ChannelList/ChannelList.jsx';
import ChatHeader from '../components/ChatHeader/ChatHeader.jsx';
import MessageFeed from '../components/MessageFeed/MessageFeed.jsx';
import ChatInput from '../components/ChatInput/ChatInput.jsx';
import MemberList from '../components/MemberList/MemberList.jsx';
import AddChannelModal from '../components/AddChannelModal/AddChannelModal.jsx';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal/ConfirmDeleteModal.jsx';

import styles from './ChatPage.module.css';

/**
 * ChatPage - Full-featured real-time chat workspace.
 *
 * Integrates:
 * - Channel management and keyset-paginated navigation via useChannels
 * - Real-time STOMP messaging, reactions, edits, deletes, and pins via useChat
 * - Rich message drafting with reply and edit previews via ChatInput
 * - Group member directory with role badges via MemberList
 * - Accessible modals for channel creation and item deletion
 */
export default function ChatPage({
  group,
  currentUser: propCurrentUser,
  canManageChannels = true,
}) {
  const { activeGroup } = useGroupsContext();
  const { user: authUser } = useAuthContext();

  const currentGroup = group || activeGroup;
  const groupId = currentGroup?.id || null;
  const currentUser = propCurrentUser || authUser;

  // 1. Channel state and navigation
  const {
    channels,
    activeChannelId,
    activeChannel,
    loading: channelsLoading,
    selectChannel,
    createChannel,
    deleteChannel,
  } = useChannels({ groupId });

  // 2. Real-time chat state and actions
  const {
    messages,
    connectionError,
    hasMore,
    loadingMore,
    loadMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    togglePinMessage,
  } = useChat({
    groupId,
    channelId: activeChannelId,
    currentUser,
  });

  // 3. UI interaction state
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const [isMobileChannelsOpen, setIsMobileChannelsOpen] = useState(false);
  const [isMobileMembersOpen, setIsMobileMembersOpen] = useState(false);

  // Message draft context (replying or editing)
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  // Modals state
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'message'|'channel', data: Object }

  // Filter messages by search query if present
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        (m.content && m.content.toLowerCase().includes(query)) ||
        (m.senderName && m.senderName.toLowerCase().includes(query))
    );
  }, [messages, searchQuery]);

  // Handle edit initiation
  const handleStartEdit = (message) => {
    setEditingMessage(message);
    setReplyingTo(null);
  };

  // Handle reply initiation
  const handleStartReply = (message) => {
    setReplyingTo(message);
    setEditingMessage(null);
  };

  // Handle delete request
  const handleRequestDeleteMessage = (message) => {
    setDeleteTarget({ type: 'message', data: message });
  };

  const handleRequestDeleteChannel = (channelId) => {
    const channel = channels.find((c) => String(c.id) === String(channelId));
    if (channel) {
      setDeleteTarget({ type: 'channel', data: channel });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'message') {
      await deleteMessage(deleteTarget.data.id);
    } else if (deleteTarget.type === 'channel') {
      await deleteChannel(deleteTarget.data.id);
    }

    setDeleteTarget(null);
  };

  // Fallback when no study group is selected
  if (!groupId) {
    return (
      <div className={styles.emptyContainer} role="region" aria-label="No group selected">
        <MessageSquare size={48} className={styles.placeholderIcon} />
        <h3>No Study Group Selected</h3>
        <p>Please select or join a study group from the sidebar to start chatting.</p>
      </div>
    );
  }

  return (
    <div
      className={styles.chatContainer}
      role="region"
      aria-label="StudyCollab Chat Workspace"
    >
      {/* 1. Left Channel Sidebar */}
      <ChannelList
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={selectChannel}
        onOpenAddChannelModal={() => setIsAddChannelModalOpen(true)}
        onDeleteChannel={handleRequestDeleteChannel}
        canManageChannels={canManageChannels}
        isMobileOpen={isMobileChannelsOpen}
        onCloseMobile={() => setIsMobileChannelsOpen(false)}
      />

      {/* 2. Middle Main Chat Stream */}
      <div className={styles.mainChatArea}>
        <ChatHeader
          channel={activeChannel}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showMembers={showMembers}
          onToggleMembers={() => {
            setShowMembers((prev) => !prev);
            setIsMobileMembersOpen((prev) => !prev);
          }}
          onToggleChannels={() => setIsMobileChannelsOpen((prev) => !prev)}
          onAddChannel={() => setIsAddChannelModalOpen(true)}
        />

        {connectionError && (
          <div className={styles.connectionWarning} role="alert">
            <AlertCircle size={16} />
            <span>Connection issue: {connectionError}. Reconnecting...</span>
          </div>
        )}

        {channelsLoading && channels.length === 0 ? (
          <div className={styles.loadingContainer}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Loading channels...</p>
          </div>
        ) : !activeChannel ? (
          <div className={styles.emptyContainer}>
            <MessageSquare size={36} className={styles.placeholderIcon} />
            <h3>No Channels Available</h3>
            <p>Create a channel to start discussing study material with your peers.</p>
          </div>
        ) : (
          <>
            <MessageFeed
              messages={filteredMessages}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMoreMessages}
              currentUserId={currentUser?.id}
              onAddReaction={reactToMessage}
              onReply={handleStartReply}
              onStartEdit={handleStartEdit}
              onRequestDeleteMessage={handleRequestDeleteMessage}
              onTogglePin={togglePinMessage}
            />

            <ChatInput
              channelName={activeChannel?.name}
              replyingTo={replyingTo}
              editingMessage={editingMessage}
              onCancelReply={() => setReplyingTo(null)}
              onCancelEdit={() => setEditingMessage(null)}
              onSendMessage={sendMessage}
              onSaveEdit={async (id, content) => {
                await editMessage(id, content);
                setEditingMessage(null);
              }}
            />
          </>
        )}
      </div>

      {/* 3. Right Members Sidebar */}
      {showMembers && (
        <MemberList
          groupId={groupId}
          currentUserId={currentUser?.id}
          isOpen={isMobileMembersOpen || showMembers}
          onClose={() => {
            setIsMobileMembersOpen(false);
            setShowMembers(false);
          }}
        />
      )}

      {/* 4. Accessible Dialogs */}
      <AddChannelModal
        isOpen={isAddChannelModalOpen}
        onClose={() => setIsAddChannelModalOpen(false)}
        onCreateChannel={createChannel}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'channel'
            ? 'Delete Channel'
            : 'Delete Message'
        }
        message={
          deleteTarget?.type === 'channel'
            ? `Are you sure you want to delete #${deleteTarget?.data?.name}? All messages in this channel will be permanently removed.`
            : 'Are you sure you want to delete this message? This action cannot be undone.'
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
