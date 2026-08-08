import React from 'react';
import styles from './DangerZoneCard.module.css';

export default function DangerZoneCard({ isOwner, onLeaveGroup, onDeleteGroup }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconBox}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h3>Danger Zone</h3>
          <p className={styles.subtitle}>Irreversible and sensitive actions for this group.</p>
        </div>
      </div>

      <div className={styles.actionsContainer}>
        {/* Leave Group Action */}
        <div className={styles.actionRow}>
          <div className={styles.actionText}>
            <h4>Leave Group</h4>
            <p>Revoke your access to this study group and its shared materials.</p>
          </div>
          <button type="button" className={styles.warningBtn} onClick={onLeaveGroup}>
            Leave Group
          </button>
        </div>

        <div className={styles.divider} />

        {/* Delete Group Action */}
        <div className={styles.actionRow}>
          <div className={styles.actionText}>
            <h4>Delete Group</h4>
            <p>Permanently remove this group, all notes, tasks, and member lists.</p>
          </div>
          <button 
            type="button" 
            className={styles.dangerBtn} 
            onClick={onDeleteGroup}
          >
            Delete Group
          </button>
        </div>
      </div>
    </div>
  );
}