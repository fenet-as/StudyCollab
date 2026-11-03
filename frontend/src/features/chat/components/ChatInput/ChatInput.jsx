import React, { useState, useEffect, useRef } from "react";
import { Send, X, Pencil, Check } from "lucide-react";
import styles from "./ChatInput.module.css";

const MAX_CHAR_LIMIT = 1000;

export default function ChatInput({
  channelName,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  onSendMessage,
  onSaveEdit,
}) {
  const [text, setText] = useState("");
  const [prevEditingMessage, setPrevEditingMessage] = useState(null);
  const inputRef = useRef(null);

  // Sync text when entering or changing edit message
  if (editingMessage !== prevEditingMessage) {
    setPrevEditingMessage(editingMessage);
    if (editingMessage) {
      setText(editingMessage.content || "");
    }
  }

  useEffect(() => {
    if (editingMessage || replyingTo) {
      inputRef.current?.focus();
    }
  }, [editingMessage, replyingTo]);

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_CHAR_LIMIT) return;

    if (editingMessage) {
      onSaveEdit?.(editingMessage.id, trimmed);
    } else if (replyingTo) {
      onSendMessage?.({
        content: trimmed,
        replyToId: replyingTo.id,
        replySnippet: replyingTo.content,
      });
      onCancelReply?.();
    } else {
      onSendMessage?.(trimmed);
    }
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Escape") {
      if (editingMessage) {
        handleCancelEdit();
      } else if (replyingTo) {
        onCancelReply?.();
      }
    }
  };

  const handleCancelEdit = () => {
    setText("");
    onCancelEdit?.();
  };

  const remainingChars = MAX_CHAR_LIMIT - text.length;
  const isOverLimit = text.length > MAX_CHAR_LIMIT;
  const isNearLimit = remainingChars <= 50;

  return (
    <div className={styles.inputContainer}>
      {editingMessage && (
        <div className={styles.contextBanner} role="status">
          <div className={styles.contextText}>
            <Pencil size={14} className={styles.editIcon} />
            <span className={styles.bannerMessage}>
              Editing message: <em>"{editingMessage.content}"</em>
            </span>
          </div>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancelEdit}
            aria-label="Cancel editing"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {replyingTo && !editingMessage && (
        <div className={styles.contextBanner} role="status">
          <div className={styles.contextText}>
            <span className={styles.bannerMessage}>
              Replying to <strong>{replyingTo.senderName}</strong>:{" "}
              <em>"{replyingTo.content}"</em>
            </span>
          </div>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          rows={1}
          className={styles.textInput}
          maxLength={MAX_CHAR_LIMIT}
          placeholder={
            editingMessage
              ? "Update your message..."
              : `Message #${channelName || "channel"}`
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={
            editingMessage
              ? "Edit message content"
              : `Message #${channelName || "channel"}`
          }
        />

        <div className={styles.inputControls}>
          <span
            className={`${styles.charCounter} ${
              isNearLimit ? styles.nearLimit : ""
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {remainingChars}
          </span>

          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!text.trim() || isOverLimit}
            aria-label={editingMessage ? "Save edit" : "Send message"}
          >
            {editingMessage ? <Check size={18} /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
