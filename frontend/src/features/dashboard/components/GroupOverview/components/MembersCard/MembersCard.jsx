import React from 'react';
import styles from './MembersCard.module.css';

const BACKEND_BASE_URL = 'http://localhost:8080';

export default function MembersCard({ members, totalMembersCount, handleGoToGroupSettings }) {
  const extraMembersCount = Math.max(0, (totalMembersCount || 0) - (members?.length || 0));

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>Members</h3>
        <button className={styles.viewAllBtn} onClick={handleGoToGroupSettings}>
          + Add Member
        </button>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.membersGrid}>
          {members?.map((m) => (
            <div 
              key={m.id} 
              className={styles.memberAvatarCircle} 
              title={`${m.name} - Open Group Settings`}
              onClick={handleGoToGroupSettings}
            >
              {m.avatarUrl ? (
                <img
                  src={m.avatarUrl.startsWith('http') ? m.avatarUrl : `${BACKEND_BASE_URL}${m.avatarUrl}`}
                  alt={m.name}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  <span>{getInitials(m.name)}</span>
                </div>
              )}
              <span className={styles.memberNameLabel}>
                {m.name ? m.name.split(' ')[0] : 'User'}
              </span>
            </div>
          ))}
          {extraMembersCount > 0 && (
            <div 
              className={styles.memberAvatarCircle}
              onClick={handleGoToGroupSettings}
              title="View all members in Group Settings"
            >
              <div className={styles.moreCircle}>
                <span>+{extraMembersCount}</span>
              </div>
              <span className={styles.memberNameLabel}>More</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}