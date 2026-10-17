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

  if (editingMessage !== prevEditingMessage) {
    setPrevEditingMessage(editingMessage);
    if (editingMessage) {
      setText(editingMessage.content);
    }
  }

  useEffect(() => {
    if (editingMessage) {
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_CHAR_LIMIT) return;

    if (editingMessage) {
      onSaveEdit(editingMessage.id, trimmed);
    } else {
      onSendMessage(trimmed);
    }
    setText("");
  };

  const handleCancelEdit = () => {
    setText("");
    onCancelEdit();
  };

  const remainingChars = MAX_CHAR_LIMIT - text.length;

  return (
    <div className={styles.inputContainer}>
      {editingMessage && (
        <div className={styles.contextBanner}>
          <div className={styles.contextText}>
            <Pencil size={14} className={styles.editIcon} />
            <span className={styles.bannerMessage}>
              Editing message: <em>"{editingMessage.content}"</em>
            </span>
          </div>
          <button
            className={styles.cancelBtn}
            onClick={handleCancelEdit}
            aria-label="Cancel editing"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {replyingTo && !editingMessage && (
        <div className={styles.contextBanner}>
          <div className={styles.contextText}>
            <span className={styles.bannerMessage}>
              Replying to <strong>{replyingTo.senderName}</strong>:{" "}
              <em>"{replyingTo.content}"</em>
            </span>
          </div>
          <button
            className={styles.cancelBtn}
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className={styles.textInput}
          maxLength={MAX_CHAR_LIMIT}
          placeholder={
            editingMessage
              ? "Update your message..."
              : `Message #${channelName || "channel"}`
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className={styles.inputControls}>
          <span
            className={`${styles.charCounter} ${
              remainingChars < 50 ? styles.nearLimit : ""
            }`}
          >
            {remainingChars}
          </span>

          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!text.trim() || text.length > MAX_CHAR_LIMIT}
            aria-label={editingMessage ? "Save edit" : "Send message"}
          >
            {editingMessage ? <Check size={18} /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}