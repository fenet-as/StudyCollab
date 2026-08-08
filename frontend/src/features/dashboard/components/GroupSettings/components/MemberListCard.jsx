import React, { useState, useEffect } from 'react';
import { Users, MoreVertical, Zap, ArrowDown, Trash2 } from 'lucide-react';
import styles from './MemberListCard.module.css';

export default function MemberListCard({
  members = [],
  onPromote,
  onDemote,
  onRemove,
  readOnly = false,
}) {
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [message, setMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ text: '', isError: false }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(`.${styles.dropdownContainer}`)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleDropdown = (id) => {
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  const handlePromoteAction = async (targetUserId, name) => {
    setActiveDropdownId(null);
    setMessage({ text: '', isError: false });
    try {
      if (onPromote) {
        await onPromote(targetUserId);
        setMessage({
          text: `${name || 'Member'} promoted to Administrator!`,
          isError: false,
        });
      }
    } catch (err) {
      setMessage({
        text: err?.message || 'Unauthorized action.',
        isError: true,
      });
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconBox}>
          <Users size={20} className={styles.icon} />
        </div>
        <div>
          <h3>Group Members ({members.length})</h3>
          <p className={styles.subtitle}>
            {readOnly
              ? 'List of active group members.'
              : 'Manage active members and role permissions.'}
          </p>
        </div>
      </div>

      {message.text && (
        <p className={message.isError ? styles.errorMsg : styles.successMsg}>
          {message.text}
        </p>
      )}

      <div className={styles.membersWrapper}>
        {members.length === 0 ? (
          <div className={styles.emptyBox}>No members currently in this group.</div>
        ) : (
          members.map((member) => {
            const targetUserId = member.userId || member.id;
            const roleDisplay = member.role ? member.role.toUpperCase() : 'MEMBER';
            const isOwnerOrCreator = roleDisplay === 'OWNER' || roleDisplay === 'CREATOR';
            const isAlreadyAdmin = isOwnerOrCreator || roleDisplay === 'ADMIN';
            
            // Check potential backend key names for the avatar URL
            const avatarUrl = member.avatarUrl || member.avatar_url || member.avatar;

            return (
              <div key={targetUserId} className={styles.memberRow}>
                <div className={styles.identity}>
                  <div className={styles.avatar}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={member.fullName || 'Member avatar'}
                        className={styles.avatarImg}
                        onError={(e) => {
                          // Hide image on broken URL so fallback initial displays cleanly
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      member.fullName ? member.fullName.charAt(0).toUpperCase() : '?'
                    )}
                  </div>
                  <div className={styles.details}>
                    <h4>{member.fullName || 'Registered Student'}</h4>
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className={styles.controls}>
                  <span className={`${styles.badge} ${styles[roleDisplay.toLowerCase()] || styles.member}`}>
                    {isOwnerOrCreator ? 'Owner' : roleDisplay === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>

                  {!readOnly && (
                    <div className={styles.dropdownContainer}>
                      <button
                        type="button"
                        className={styles.threeDotsBtn}
                        onClick={() => toggleDropdown(targetUserId)}
                        aria-label="Manage member"
                      >
                        <MoreVertical size={18} className={styles.dotsIcon} />
                      </button>

                      {activeDropdownId === targetUserId && (
                        <div className={styles.dropdownMenu}>
                          <div className={styles.dropdownHeader}>Actions</div>

                          {!isAlreadyAdmin && (
                            <button
                              type="button"
                              className={styles.itemBtn}
                              onClick={() => handlePromoteAction(targetUserId, member.fullName)}
                            >
                              <Zap size={16} className={styles.actionSvg} />
                              Make Admin
                            </button>
                          )}

                          {roleDisplay === 'ADMIN' && !isOwnerOrCreator && (
                            <button
                              type="button"
                              className={styles.itemBtn}
                              onClick={() => {
                                setActiveDropdownId(null);
                                onDemote(targetUserId, member.fullName);
                              }}
                            >
                              <ArrowDown size={16} className={styles.actionSvg} />
                              Demote to Member
                            </button>
                          )}

                          {!isOwnerOrCreator && (
                            <button
                              type="button"
                              className={`${styles.itemBtn} ${styles.destructive}`}
                              onClick={() => {
                                setActiveDropdownId(null);
                                onRemove(targetUserId, member.fullName);
                              }}
                            >
                              <Trash2 size={16} className={styles.actionSvg} />
                              Remove Member
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}