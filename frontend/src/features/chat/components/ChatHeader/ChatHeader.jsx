import React, { useState } from "react";
import { Hash, Search, Users, X, Menu, Plus } from "lucide-react";
import styles from "./ChatHeader.module.css";

export default function ChatHeader({
  channel,
  searchQuery,
  onSearchChange,
  showMembers,
  onToggleMembers,
  onToggleChannels,
  onAddChannel,
}) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <header className={styles.chatHeader}>
      <div
        className={`${styles.channelTitleMeta} ${
          isMobileSearchOpen ? styles.hideOnMobileSearch : ""
        }`}
      >
        {/* Mobile Navigation Actions */}
        <div className={styles.mobileNavGroup}>
          <button
            className={`${styles.iconBtn} ${styles.mobileMenuBtn}`}
            onClick={onToggleChannels}
            aria-label="Open Channels Drawer"
            title="Channels"
          >
            <Menu size={20} />
          </button>
          
          {/* Quick Add Channel Icon for Mobile Header */}
          {onAddChannel && (
            <button
              className={`${styles.iconBtn} ${styles.mobileAddBtn}`}
              onClick={onAddChannel}
              aria-label="Add Channel"
              title="Add Channel"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        <div className={styles.channelTitle}>
          <Hash size={18} className={styles.hashIcon} />
          <h3>{channel?.name || "channel"}</h3>
        </div>
        {channel?.description && (
          <p className={styles.channelDesc}>{channel.description}</p>
        )}
      </div>

      <div className={styles.headerActions}>
        {/* Expanded Search Box */}
        <div
          className={`${styles.searchBox} ${
            isMobileSearchOpen ? styles.searchBoxMobileActive : ""
          }`}
        >
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {isMobileSearchOpen && (
            <button
              className={styles.closeSearchBtn}
              onClick={() => {
                setIsMobileSearchOpen(false);
                onSearchChange("");
              }}
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Mobile Search Toggle Trigger */}
        {!isMobileSearchOpen && (
          <button
            className={`${styles.iconBtn} ${styles.mobileSearchTrigger}`}
            onClick={() => setIsMobileSearchOpen(true)}
            aria-label="Open search"
          >
            <Search size={18} />
          </button>
        )}

        <button
          className={`${styles.iconBtn} ${
            showMembers ? styles.activeBtn : ""
          } ${isMobileSearchOpen ? styles.hideOnMobileSearch : ""}`}
          onClick={onToggleMembers}
          title="Toggle Members Pane"
          aria-label="Toggle Members Pane"
        >
          <Users size={18} />
        </button>
      </div>
    </header>
  );
}