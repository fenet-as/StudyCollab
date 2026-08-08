import React, { useState, useEffect } from 'react';
import { groupApi } from "../../../../../api/groupApi";
import styles from './GroupDetailsCard.module.css';

export default function GroupAvatarCard({ group, onAvatarUpdated, isReadOnly = false }) {
  const [avatarUrl, setAvatarUrl] = useState(group?.avatar || group?.avatarUrl || group?.avatarPath || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Sync state whenever parent group prop updates
  useEffect(() => {
    if (group) {
      setAvatarUrl(group.avatar || group.avatarUrl || group.avatarPath || '');
      setAvatarPreview(null);
      setSelectedFile(null);
    }
  }, [group]);

  // Auto-dismiss feedback message after 4 seconds
  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ text: '', isError: false }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || isReadOnly) return;

    setIsUploading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await groupApi.uploadGroupAvatar(group.id, selectedFile);
      const newAvatarUrl = response.avatarUrl || avatarPreview;

      setAvatarUrl(newAvatarUrl);
      setSelectedFile(null);
      setAvatarPreview(null);
      setMessage({ text: 'Avatar updated successfully!', isError: false });

      if (onAvatarUpdated) {
        onAvatarUpdated(newAvatarUrl);
      }
    } catch (err) {
      setMessage({ text: err.message || 'Failed to upload avatar.', isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    setMessage({ text: '', isError: false });
  };

  const activeImageSrc = avatarPreview || avatarUrl;
  const initial = group?.name ? group.name.charAt(0).toUpperCase() : 'G';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3>Group Avatar</h3>
          <p className={styles.subtitle}>Upload or manage the group profile picture.</p>
        </div>
      </div>

      <div className={styles.avatarSection}>
        <div className={styles.avatarWrapper}>
          {activeImageSrc ? (
            <img src={activeImageSrc} alt="Group Avatar" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarFallback}>{initial}</div>
          )}
        </div>

        {!isReadOnly && (
          <div className={styles.avatarUploadWrapper}>
            <label htmlFor="groupAvatarInput" className={styles.uploadBtn}>
              Choose Photo
            </label>
            <input
              id="groupAvatarInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <span className={styles.uploadHint}>JPG, PNG, or GIF up to 5MB</span>
          </div>
        )}
      </div>

      {selectedFile && !isReadOnly && (
        <div className={styles.actions} style={{ marginTop: '1rem' }}>
          <button 
            type="button" 
            className={styles.saveBtn} 
            onClick={handleUpload} 
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Save Avatar'}
          </button>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={handleCancel} 
            disabled={isUploading}
          >
            Cancel
          </button>
        </div>
      )}

      {message.text && (
        <p className={message.isError ? styles.errorMsg : styles.successMsg}>
          {message.text}
        </p>
      )}
    </div>
  );
}