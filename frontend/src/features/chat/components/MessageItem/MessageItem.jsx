import React, { useState, useEffect, useRef } from "react";
import { Reply, Pencil, Trash2, Smile, Pin, MoreHorizontal } from "lucide-react";
import styles from "./MessageItem.module.css";

const CATEGORIZED_EMOJIS = {
  Popular: ["👍", "❤️", "🔥", "😂", "🎉", "😮", "😢", "💯"],
  Faces: ["😀", "😎", "🥳", "🤔", "😴", "🤯", "🤖", "😭"],
  Hands: ["👏", "🙌", "🤝", "🙏", "✌️", "🫡", "👋", "💪"],
  Objects: ["🚀", "💡", "📌", "🏆", "🎯", "⭐", "✅", "⚡"],
};

export default function MessageItem({
  message,
  onAddReaction,
  onReply,
  onStartEdit,
  onRequestDelete,
  onTogglePin,
  onScrollToMessage,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Popular");
  const popoverRef = useRef(null);

  const roleClass = message.role
    ? styles[`role_${message.role.toLowerCase()}`]
    : "";

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
        setShowMobileActions(false);
      }
    }
    if (showEmojiPicker || showMobileActions) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showEmojiPicker, showMobileActions]);

  return (
    <div
      id={`msg-${message.id}`}
      className={`${styles.messageWrapper} ${
        message.isMine ? styles.myMessage : styles.theirMessage
      }`}
      ref={popoverRef}
    >
      {!message.isMine && (
        <div className={styles.avatar}>
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt={message.senderName} />
          ) : (
            <span>{message.senderInitials}</span>
          )}
        </div>
      )}

      <div className={styles.messageBubbleGroup}>
        <div className={styles.messageMeta}>
          {!message.isMine && (
            <span className={styles.senderName}>{message.senderName}</span>
          )}
          {message.role && (
            <span className={`${styles.roleBadge} ${roleClass}`}>
              {message.role}
            </span>
          )}
          <span className={styles.timestamp}>
            {message.timestamp}{" "}
            {message.isEdited && (
              <span className={styles.editedLabel}>(edited)</span>
            )}
          </span>
          {message.pinned && (
            <span className={styles.pinnedBadge} title="Pinned message">
              <Pin size={10} /> Pinned
            </span>
          )}
        </div>

        {message.replyTo && (
          <button
            type="button"
            className={styles.repliedContext}
            onClick={() => onScrollToMessage(message.replyToId)}
            title="Click to jump to original message"
            aria-label={`Jump to replied message: ${message.replyTo}`}
          >
            <Reply size={12} />
            <span className={styles.repliedText}>{message.replyTo}</span>
          </button>
        )}

        <div className={styles.messageBubbleContainer}>
          <div
            className={styles.messageBubble}
            onClick={() => setShowMobileActions((prev) => !prev)}
          >
            <p>{message.content}</p>
          </div>

          {/* Quick Mobile Menu Trigger Button */}
          <button
            className={styles.mobileMoreBtn}
            onClick={() => setShowMobileActions((prev) => !prev)}
            aria-label="Toggle message actions"
          >
            <MoreHorizontal size={14} />
          </button>

          {/* Hover & Touch Action Menu */}
          <div
            className={`${styles.hoverActions} ${
              showMobileActions ? styles.mobileActionsVisible : ""
            }`}
          >
            <div className={styles.reactionPickerContainer}>
              <button
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                title="Add Reaction"
                aria-label="Add reaction"
              >
                <Smile size={15} />
              </button>

              {showEmojiPicker && (
                <div
                  className={`${styles.emojiPickerPopover} ${
                    message.isMine ? styles.popoverLeft : styles.popoverRight
                  }`}
                >
                  <div className={styles.categoryTabs}>
                    {Object.keys(CATEGORIZED_EMOJIS).map((cat) => (
                      <button
                        key={cat}
                        className={`${styles.tabBtn} ${
                          activeCategory === cat ? styles.activeTab : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory(cat);
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className={styles.emojiGrid}>
                    {CATEGORIZED_EMOJIS[activeCategory].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddReaction(message.id, emoji);
                          setShowEmojiPicker(false);
                          setShowMobileActions(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                onReply(message);
                setShowMobileActions(false);
              }}
              title="Reply"
              aria-label="Reply to message"
            >
              <Reply size={15} />
            </button>

            <button
              className={`${styles.actionBtn} ${
                message.pinned ? styles.pinnedActionBtn : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(message.id);
                setShowMobileActions(false);
              }}
              title={message.pinned ? "Unpin Message" : "Pin Message"}
              aria-label="Toggle pin"
            >
              <Pin size={15} />
            </button>

            {message.isMine && (
              <>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(message);
                    setShowMobileActions(false);
                  }}
                  title="Edit Message"
                  aria-label="Edit message"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDelete(message);
                    setShowMobileActions(false);
                  }}
                  title="Delete Message"
                  aria-label="Delete message"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className={styles.reactionsList}>
            {message.reactions.map((rxn, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.reactionPill} ${
                  rxn.userReacted ? styles.activeReactionPill : ""
                }`}
                onClick={() => onAddReaction(message.id, rxn.emoji)}
                title={
                  rxn.userReacted ? "Click to unreact" : "Click to react"
                }
                aria-label={`${rxn.emoji} ${rxn.count} reactions. ${
                  rxn.userReacted ? "Click to unreact" : "Click to react"
                }`}
              >
                {rxn.emoji} {rxn.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}