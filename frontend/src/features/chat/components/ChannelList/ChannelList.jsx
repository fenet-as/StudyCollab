import React, { useState } from "react";
import { Hash, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ChannelList.module.css";

const MAX_CHANNELS = 10;

export default function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
  onOpenAddChannelModal,
  onDeleteChannel,
  isMobileOpen,
  onCloseMobile,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMaxReached = channels.length >= MAX_CHANNELS;

  const handleSelect = (id) => {
    onSelectChannel(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          isCollapsed ? styles.sidebarCollapsed : ""
        } ${isMobileOpen ? styles.mobileOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            Channels ({channels.length}/{MAX_CHANNELS})
          </h2>
          <button
            className={styles.collapseToggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className={styles.channelList}>
          {channels.map((channel) => {
            const isActive = channel.id === activeChannelId;
            const isGeneral = channel.id === "general";

            return (
              <div
                key={channel.id}
                role="button"
                tabIndex={0}
                aria-selected={isActive}
                aria-label={`Channel #${channel.name}`}
                className={`${styles.channelItem} ${
                  isActive ? styles.activeChannel : ""
                }`}
                onClick={() => handleSelect(channel.id)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
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

                {!isGeneral && (
                  <button
                    className={styles.deleteChannelBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChannel(channel.id);
                    }}
                    title="Delete Channel"
                    aria-label={`Delete channel #${channel.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.addChannelBtn}
            onClick={() => {
              onOpenAddChannelModal();
              if (onCloseMobile) onCloseMobile();
            }}
            disabled={isMaxReached}
            title={
              isMaxReached
                ? "Maximum channel limit reached (10)"
                : "Create Channel"
            }
          >
            <Plus size={18} />
            <span className={styles.addChannelText}>
              {isMaxReached ? "Limit Reached" : "Add Channel"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}