import React, { useState } from 'react';
import { Hash, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ChannelList.module.css';

const MAX_CHANNELS = 10;

export default function ChannelList({
  channels = [],
  activeChannelId,
  onSelectChannel,
  onOpenAddChannelModal,
  onDeleteChannel,
  canManageChannels = true,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const channelCount = Array.isArray(channels) ? channels.length : 0;
  const isMaxReached = channelCount >= MAX_CHANNELS;

  const handleSelect = (id) => {
    if (onSelectChannel) {
      onSelectChannel(id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          isCollapsed ? styles.sidebarCollapsed : ''
        } ${isMobileOpen ? styles.mobileOpen : ''}`}
        aria-label="Channels sidebar"
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            Channels ({channelCount}/{MAX_CHANNELS})
          </h2>
          <button
            type="button"
            className={styles.collapseToggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className={styles.channelList} role="tablist" aria-orientation="vertical">
          {channels.map((channel) => {
            const isActive = String(channel.id) === String(activeChannelId);
            const isDefault = Boolean(channel.isDefault) || channel.name === 'general';
            const canDelete = !isDefault && canManageChannels && Boolean(onDeleteChannel);

            return (
              <div
                key={channel.id}
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                aria-label={`Channel #${channel.name}`}
                className={`${styles.channelItem} ${
                  isActive ? styles.activeChannel : ''
                }`}
                onClick={() => handleSelect(channel.id)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSelect(channel.id);
                  }
                }}
                title={isCollapsed ? `#${channel.name}` : undefined}
              >
                <div className={styles.channelMain}>
                  <Hash size={18} className={styles.hashIcon} />
                  <span className={styles.channelName}>{channel.name}</span>
                </div>

                {canDelete && (
                  <button
                    type="button"
                    className={styles.deleteChannelBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChannel(channel.id);
                    }}
                    title={`Delete channel #${channel.name}`}
                    aria-label={`Delete channel #${channel.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {canManageChannels && onOpenAddChannelModal && (
          <div className={styles.sidebarFooter}>
            <button
              type="button"
              className={styles.addChannelBtn}
              onClick={() => {
                onOpenAddChannelModal();
                if (onCloseMobile) onCloseMobile();
              }}
              disabled={isMaxReached}
              title={
                isMaxReached
                  ? 'Maximum channel limit reached (10)'
                  : 'Create Channel'
              }
              aria-label="Create Channel"
            >
              <Plus size={18} />
              <span className={styles.addChannelText}>
                {isMaxReached ? 'Limit Reached' : 'Add Channel'}
              </span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
