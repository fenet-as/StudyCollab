// frontend/src/components/interactive/DeleteConfirmModal/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import styles from './DeleteConfirmModal.module.css';

export default function DeleteConfirmModal({ isOpen, groupName, onConfirm, onClose }) {
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setConfirmName('');
      setError('');
      setIsDeleting(false);
      setIsClosing(false);
    }
  }

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    if (isDeleting) return; // Prevent closing while API request is in-flight
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Matches CSS transition duration
  };

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
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete group. You might not have authorization.');
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className={`${styles.modalOverlay} ${isClosing ? styles.fadeOut : styles.fadeIn}`} 
      onClick={handleClose}
    >
      <div 
        className={`${styles.modalContent} ${isClosing ? styles.scaleDown : styles.scaleUp}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          className={styles.closeBtn} 
          onClick={handleClose} 
          disabled={isDeleting}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.iconContainer}>
            <AlertTriangle className={styles.warningIcon} size={22} />
          </div>
          <div>
            <h3>Delete Study Group</h3>
            <span className={styles.subTitle}>Action cannot be undone</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <p className={styles.warningText}>
            Are you sure you want to delete <strong>{groupName}</strong>? All associated files, notes, tasks, and memberships will be permanently deleted.
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
              disabled={isDeleting}
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <div className={styles.buttonRow}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.deleteBtn}
              disabled={confirmName !== groupName || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className={styles.spinner} size={16} />
                  <span>Deleting...</span>
                </>
              ) : (
                'Permanently Delete'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}