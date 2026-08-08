import React, { useState, useEffect } from 'react';
import { groupApi } from "../../../../../api/groupApi";
import styles from './GroupDetailsCard.module.css';

function EditIcon({ className }) {
  return (
    <svg 
      className={className}
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export default function GroupDetailsCard({ group, onGroupUpdated, isReadOnly = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  
  const [infoMessage, setInfoMessage] = useState({ text: '', isError: false });
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setDescription(group.description || '');
    }
  }, [group]);

  useEffect(() => {
    if (!infoMessage.text) return;
    const timer = setTimeout(() => {
      setInfoMessage({ text: '', isError: false });
    }, 4000);
    return () => clearTimeout(timer);
  }, [infoMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    setIsUpdatingInfo(true);
    setInfoMessage({ text: '', isError: false });

    try {
      const updatedGroup = await groupApi.updateGroupDetails(group.id, {
        name: groupName,
        description,
      });

      setIsEditing(false);
      setInfoMessage({ text: 'Group details saved successfully!', isError: false });

      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }
    } catch (error) {
      setInfoMessage({ text: error.message || 'Failed to update details.', isError: true });
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleCancel = () => {
    setGroupName(group?.name || '');
    setDescription(group?.description || '');
    setInfoMessage({ text: '', isError: false });
    setIsEditing(false);
  };

  return (
    <div className={`${styles.card} ${isEditing ? styles.editingActive : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <span className={styles.icon}>
            <EditIcon />
          </span>
          <div>
            <h3>Group Details</h3>
            <p className={styles.subtitle}>The core identity and settings of your group.</p>
          </div>
        </div>
        {!isReadOnly && !isEditing && (
          <button type="button" className={styles.editBtn} onClick={() => setIsEditing(true)}>
            Edit Details
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="groupName">Group Name</label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            readOnly={isReadOnly || !isEditing}
            className={(isReadOnly || !isEditing) ? styles.readOnly : styles.editable}
            placeholder="Enter group name..."
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="groupDesc">Description</label>
          <textarea
            id="groupDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            readOnly={isReadOnly || !isEditing}
            className={(isReadOnly || !isEditing) ? styles.readOnly : styles.editable}
            placeholder="What is this group about?"
          />
        </div>

        {infoMessage.text && (
          <p className={infoMessage.isError ? styles.errorMsg : styles.successMsg}>
            {infoMessage.text}
          </p>
        )}

        {!isReadOnly && isEditing && (
          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn} disabled={isUpdatingInfo}>
              {isUpdatingInfo ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={isUpdatingInfo}>
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}