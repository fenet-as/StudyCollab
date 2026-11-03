import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { validateChannelName } from '../../utils/chatValidation.js';
import styles from './AddChannelModal.module.css';

export default function AddChannelModal({ isOpen, onClose, onCreateChannel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    // Automatically slugify: lowercase and replace spaces with hyphens
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setName(val);
    if (error) setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validateChannelName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateChannel({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      const serverMsg =
        err.response?.data?.message || err.message || 'Failed to create channel.';
      setError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-channel-title"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 id="add-channel-title">Create Channel</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="channelName">Channel Name</label>
            <input
              id="channelName"
              type="text"
              placeholder="e.g. homework-help"
              value={name}
              onChange={handleNameChange}
              disabled={isSubmitting}
              maxLength={50}
              required
              autoFocus
            />
            <span className={styles.fieldHint}>
              Lowercase letters, numbers, and hyphens (2-50 chars).
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="channelDesc">Description (Optional)</label>
            <input
              id="channelDesc"
              type="text"
              placeholder="What is this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              maxLength={255}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />
                  Creating...
                </>
              ) : (
                'Create Channel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
