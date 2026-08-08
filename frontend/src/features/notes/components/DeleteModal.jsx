import React from 'react';
import styles from './DeleteModal.module.css';

export default function DeleteModal({ isOpen, noteTitle, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Delete Note?</h3>
        <p className={styles.modalDescription}>
          Are you sure you want to permanently delete <strong>"{noteTitle}"</strong>? This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmDeleteBtn} onClick={onConfirm}>
            Delete Note
          </button>
        </div>
      </div>
    </div>
  );
}