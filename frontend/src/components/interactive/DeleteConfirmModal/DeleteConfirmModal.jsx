// frontend/src/components/interactive/DeleteConfirmModal/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import styles from './DeleteConfirmModal.module.css';

export default function DeleteConfirmModal({ isOpen, groupName, onConfirm, onClose }) {
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmName !== groupName) {
      setError("Group name does not match.");
      return;
    }

    try {
      setError('');
      setIsDeleting(true);
      await onConfirm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete group. You might not have authorization.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <span className={styles.warningIcon}>⚠️</span>
          <h3>Delete Study Group</h3>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <p className={styles.warningText}>
            Are you absolutely sure you want to delete <strong>{groupName}</strong>? 
            This action is permanent, and will delete all group tasks, files, notes, and memberships.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmInput">
              Type <strong>{groupName}</strong> to confirm:
            </label>
            <input
              id="confirmInput"
              type="text"
              className={styles.textInput}
              placeholder={groupName}
              value={confirmName}
              onChange={(e) => {
                setError('');
                setConfirmName(e.target.value);
              }}
              required
              autoFocus
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.buttonRow}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.deleteBtn}
              disabled={confirmName !== groupName || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}