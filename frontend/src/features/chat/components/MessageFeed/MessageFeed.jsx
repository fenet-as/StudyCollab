import React, { useEffect, useRef } from "react";
import { Hash, Pin, X } from "lucide-react";
import MessageItem from "../MessageItem/MessageItem";
import styles from "./MessageFeed.module.css";

export default function MessageFeed({
  messages,
  onAddReaction,
  onReply,
  onStartEdit,
  onRequestDeleteMessage,
  onTogglePin,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className={styles.feedWrapper}>
      {pinnedMessages.length > 0 && (
        <div className={styles.pinnedBar}>
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
                  onClick={() => onTogglePin(pm.id)}
                  title="Unpin message"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.messageFeed}>
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}