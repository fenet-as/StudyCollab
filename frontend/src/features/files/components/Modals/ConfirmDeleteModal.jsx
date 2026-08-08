// src/features/files/components/Modals/ConfirmDeleteModal.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './Modals.module.css';

export default function ConfirmDeleteModal({ target, onClose, onConfirm, loading }) {
  if (!target) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.confirmModalContent}>
        <div className={styles.warningIconWrapper}>
          <AlertTriangle size={32} className={styles.warningIcon} color="#e53e3e" />
        </div>
        <h3>Delete {target.type === 'folder' ? 'Folder' : 'File'}?</h3>
        <p className={styles.confirmDescription}>
          Are you sure you want to permanently delete <strong>{target.name}</strong>? 
          {target.type === 'folder' && target.hasChildren && (
            <span className={styles.alertEmphasis}>
              {" "}Warning: This folder contains subdirectories that will also be deleted.
            </span>
          )}
          {" "}This action cannot be undone.
        </p>
        <div className={styles.confirmModalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.confirmDeleteBtn} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}