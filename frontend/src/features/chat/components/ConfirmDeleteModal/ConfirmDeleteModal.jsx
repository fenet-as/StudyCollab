import React from "react";
import { AlertTriangle, X } from "lucide-react";
import styles from "./ConfirmDeleteModal.module.css";

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.warningTitle}>
            <AlertTriangle className={styles.warningIcon} size={20} />
            <h3 id="modal-title">{title || "Confirm Delete"}</h3>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p>{message || "Are you sure you want to perform this action?"}</p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.deleteBtn} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}