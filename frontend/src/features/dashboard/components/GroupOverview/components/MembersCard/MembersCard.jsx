import React from 'react';
import styles from './MembersCard.module.css';
import { SERVER_BASE_URL } from '../../../../../../api/config';

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
            <button 
              key={m.id} 
              type="button"
              className={styles.memberAvatarCircle} 
              title={`${m.name} - Open Group Settings`}
              aria-label={`${m.name} - Open Group Settings`}
              onClick={handleGoToGroupSettings}
            >
              {m.avatarUrl ? (
                <img
                  src={m.avatarUrl.startsWith('http') ? m.avatarUrl : `${SERVER_BASE_URL}${m.avatarUrl}`}
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
            </button>
          ))}
          {extraMembersCount > 0 && (
            <button 
              type="button"
              className={styles.memberAvatarCircle}
              onClick={handleGoToGroupSettings}
              title="View all members in Group Settings"
              aria-label={`View ${extraMembersCount} more members in Group Settings`}
            >
              <div className={styles.moreCircle}>
                <span>+{extraMembersCount}</span>
              </div>
              <span className={styles.memberNameLabel}>More</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}