import React, { useState, useEffect } from 'react';
import { Image, Loader2, X } from 'lucide-react';
import Avatar from '../../../../../components/common/Avatar/Avatar';
import { userApi } from '../../../../../api/userApi';
import { getFriendlyErrorMessage } from '../utils/errorHelpers';
import styles from './AvatarCard.module.css';

export default function AvatarCard({ avatarUrl, fullName, onAvatarUpdated }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Close preview on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsPreviewOpen(false);
    };
    if (isPreviewOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    setMessage({ text: 'The photo must be smaller than 2MB.', isError: true });
    setTimeout(() => setMessage({ text: '', isError: false }), 5000);
    return;
  }

  setLoading(true);
  setMessage({ text: '', isError: false });

  try {
    const data = await userApi.updateAvatar(file);
    const freshAvatarUrl = `${data.avatarUrl}?t=${Date.now()}`;

    localStorage.setItem('avatarUrl', freshAvatarUrl);
    setMessage({ text: 'Profile picture updated successfully!', isError: false });

    // Trigger parent callback directly with the fresh avatar URL
    if (typeof onAvatarUpdated === 'function') {
      onAvatarUpdated(freshAvatarUrl);
    }
  } catch (err) {
    const errorText = getFriendlyErrorMessage(err, 'Failed to upload photo. Please try a different file.');
    setMessage({ text: errorText, isError: true });
  } finally {
    setLoading(false);
    setTimeout(() => setMessage({ text: '', isError: false }), 5000);
  }
};

  return (
    <>
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>
            <Image size={20} />
          </span>
          <div>
            <h3>Profile Picture</h3>
            <p className={styles.cardSubtitle}>This photo will be shown to your group members.</p>
          </div>
        </div>

        <div className={styles.avatarWorkspaceBody}>
          <div className={styles.avatarControlColumn}>
            <div className={styles.uploadActionRow}>
              {/* Clickable Avatar Badge with preview trigger */}
              <button
                type="button"
                className={styles.currentImageBadge}
                onClick={() => setIsPreviewOpen(true)}
                title="Click to preview image"
                aria-label="Preview avatar image"
              >
                <Avatar src={avatarUrl} name={fullName} size="medium" />
                {loading && (
                  <div className={styles.avatarBlurOverlay}>
                    <Loader2 size={16} className={styles.spinnerIcon} />
                  </div>
                )}
              </button>

              <label htmlFor="isolated-avatar-input" className={styles.primaryUploadAction}>
                {loading ? 'Uploading...' : 'Choose New Photo'}
              </label>
            </div>

            <input
              id="isolated-avatar-input"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleAvatarChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            <p className={styles.metaHintText}>Supports JPG or PNG images. Maximum size is 2MB.</p>
          </div>
        </div>

        {message.text && (
          <p className={message.isError ? styles.errorMsg : styles.successMsg}>
            {message.text}
          </p>
        )}
      </div>

      {/* Lightbox / Preview Modal Overlay */}
      {isPreviewOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsPreviewOpen(false)}
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
            
            {/* Expanded Rectangular Preview Frame */}
            <div className={styles.largePreviewFrame}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Avatar preview'}
                  className={styles.rectangularPreviewImage}
                />
              ) : (
                <div className={styles.fallbackRectangularInitials}>
                  {fullName ? fullName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            
            {fullName && <p className={styles.previewName}>{fullName}</p>}
          </div>
        </div>
      )}
    </>
  );
}