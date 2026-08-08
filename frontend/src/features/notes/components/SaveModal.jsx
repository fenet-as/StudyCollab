import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from './SaveModal.module.css';

export default function SaveModal({ isOpen, noteTitle, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.successIconWrapper}>
          <CheckCircle2 size={40} className={styles.successIcon} />
        </div>
        <h3 className={styles.modalTitle}>Saved Successfully!</h3>
        <p className={styles.modalDescription}>
          Your updates for <strong>"{noteTitle || 'Untitled Note'}"</strong> have been saved.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.saveOkBtn} onClick={onClose}>
            Awesome
          </button>
        </div>
      </div>
    </div>
  );
}