import React, { useState, useRef, useEffect } from 'react';
import { useGroupsContext } from '../../../context/useGroupsContext';
import styles from './CreateGroupModal.module.css';

// 1. Destructure the onSubmit prop passed from Dashboard
export default function CreateGroupModal({ onClose, onSubmit }) {
  // Pull our global group context tools
  const { createNewGroup, loading, error: contextError } = useGroupsContext();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [customImageFile, setCustomImageFile] = useState(null);
  const [customPreviewUrl, setCustomPreviewUrl] = useState('');
  const [localError, setLocalError] = useState('');
  
  const fileInputRef = useRef(null);

  // Clean up the object URL whenever the component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (customPreviewUrl) {
        URL.revokeObjectURL(customPreviewUrl);
      }
    };
  }, [customPreviewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomImageFile(file);
      // Revoke the old preview URL if replacing an existing image
      if (customPreviewUrl) URL.revokeObjectURL(customPreviewUrl);
      
      const previewUrl = URL.createObjectURL(file);
      setCustomPreviewUrl(previewUrl);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation(); // Stop click from triggering the file input click handler
    setCustomImageFile(null);
    if (customPreviewUrl) {
      URL.revokeObjectURL(customPreviewUrl);
      setCustomPreviewUrl('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      setLocalError('');
      
      // 2. Fire off the API context action using your modal's local state data
      const created = await createNewGroup(
        {
          name: groupName.trim(),
          description: description.trim(),
        },
        customImageFile
      );

      // 3. Notify the parent Dashboard that the group has been created!
      // This triggers the silent background fetch and auto-selects the new group.
      if (onSubmit) {
        await onSubmit(created);
      }

      // Reset state and close modal cleanly on success
      setGroupName('');
      setDescription('');
      setCustomImageFile(null);
      setCustomPreviewUrl('');
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Something went wrong creating the group.');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create New Group</h2>
          <button className={styles.closeBtn} onClick={onClose} title="Close window" disabled={loading}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            
            {/* --- ERROR DISPLAY --- */}
            {(localError || contextError) && (
              <div className={styles.errorBanner}>
                {localError || contextError}
              </div>
            )}
            
            {/* --- CUSTOM IMAGE AVATAR UPLOAD --- */}
            <div className={styles.avatarSection}>
              <div 
                className={styles.avatarPreviewContainer}
                onClick={() => !loading && fileInputRef.current.click()}
                title="Click to change group avatar picture"
              >
                {customPreviewUrl ? (
                  <div className={styles.imageWrapper}>
                    <img src={customPreviewUrl} alt="Group avatar preview" className={styles.previewImage} />
                    <button 
                      type="button" 
                      className={styles.removeImageOverlayBtn} 
                      onClick={handleRemoveImage}
                      title="Remove uploaded image"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <span className={styles.placeholderIcon}>📸</span>
                    <span className={styles.placeholderText}>Upload Photo</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>

            {/* --- GROUP DETAILS FIELDS --- */}
            <div className={styles.formGroup}>
              <label htmlFor="groupName" className={styles.formLabel}>Group Name</label>
              <input
                id="groupName"
                type="text"
                placeholder="e.g., Advanced Algorithms Study Group"
                className={styles.formInput}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.formLabel}>Description (Optional)</label>
              <textarea
                id="description"
                placeholder="What is this workspace focused on?"
                className={styles.formTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={!groupName.trim() || loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}