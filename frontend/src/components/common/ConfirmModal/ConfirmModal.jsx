import React from 'react';
import styles from './ConfirmModal.module.css';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
  error = ''
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <span className={styles.warningIcon}>⚠️</span>
          <h3>{title}</h3>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.messageText}>{message}</p>
          
          {error && (
            <div className={styles.errorBox}>
              <span>❌</span> {error}
            </div>
          )}
        </div>

        <div className={styles.buttonRow}>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`${styles.confirmBtn} ${isDestructive ? styles.destructiveBtn : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}