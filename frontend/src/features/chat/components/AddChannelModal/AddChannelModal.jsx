import React, { useState } from "react";
import { X } from "lucide-react";
import styles from "./AddChannelModal.module.css";

export default function AddChannelModal({ isOpen, onClose, onCreateChannel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Convert spaces to hyphens and lowercase for channel slug formatting
    const formattedName = name.trim().toLowerCase().replace(/\s+/g, "-");

    onCreateChannel({
      id: formattedName,
      name: formattedName,
      description: description.trim() || "No description provided.",
    });

    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Create Channel</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="channelName">Channel Name</label>
            <input
              id="channelName"
              type="text"
              placeholder="e.g. study-notes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="channelDesc">Description (Optional)</label>
            <input
              id="channelDesc"
              type="text"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!name.trim()}
            >
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}