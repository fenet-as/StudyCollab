// frontend/src/features/dashboard/components/GroupSettingsPane.jsx
import React, { useState, useEffect } from 'react';
import styles from './GroupSettingsPane.module.css';

export default function GroupSettingsPane({ group, onGroupUpdated }) {
  const [groupName, setGroupName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [infoMessage, setInfoMessage] = useState({ text: '', isError: false });
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  const [members, setMembers] = useState(group?.members || []);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberMessage, setAddMemberMessage] = useState({ text: '', isError: false });
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [copied, setCopied] = useState(false);
  const inviteLink = group?.inviteCode 
    ? `${window.location.origin}/join/${group.inviteCode}` 
    : '';

  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setDescription(group.description || '');
      setMembers(group.members || []);
    }
  }, [group]);

  const handleCopyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    setIsUpdatingInfo(true);
    setTimeout(() => {
      setIsUpdatingInfo(false);
      setInfoMessage({ text: 'Group details saved successfully!', isError: false });
      setTimeout(() => setInfoMessage({ text: '', isError: false }), 4000);
    }, 600);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    setIsAddingMember(true);
    setTimeout(() => {
      setIsAddingMember(false);
      setAddMemberMessage({ text: 'Invitation processed!', isError: false });
      setTimeout(() => setAddMemberMessage({ text: '', isError: false }), 4000);
    }, 600);
  };

  const promoteToAdmin = (memberUserId) => {
    console.log(`Promoting user ${memberUserId}`);
  };

  const handleRemoveMember = (memberUserId, memberName) => {
    const confirmRemoval = window.confirm(`Remove ${memberName || 'this member'}?`);
    if (confirmRemoval) {
      setMembers(prev => prev.filter(m => m.id !== memberUserId));
    }
  };

  return (
    <div className={styles.paneContainer}>
      <div className={styles.paneHeader}>
        <h2>Group Settings</h2>
        <p>Manage details, generate private invite links, and assign administrative roles.</p>
      </div>

      {/* Styled as a single-column vertical stack */}
      <div className={styles.settingsLayoutStack}>
        
        {/* CARD 1: EDIT GROUP DETAILS */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>✏️</span>
            <div>
              <h3>Group Details</h3>
              <p className={styles.cardSubtitle}>Update your study group's name and description.</p>
            </div>
          </div>

          <form onSubmit={handleGeneralSubmit} className={styles.settingsForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="groupName">Group Name</label>
              <input 
                id="groupName"
                type="text" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="groupDesc">Description</label>
              <textarea 
                id="groupDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
              />
            </div>

            {infoMessage.text && (
              <p className={infoMessage.isError ? styles.errorMsg : styles.successMsg}>
                {infoMessage.text}
              </p>
            )}

            <button type="submit" className={styles.saveBtn} disabled={isUpdatingInfo}>
              {isUpdatingInfo ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* CARD 2: SHARE INVITE LINK */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🔗</span>
            <div>
              <h3>Invite Link</h3>
              <p className={styles.cardSubtitle}>Share this private direct join link with your classmates.</p>
            </div>
          </div>

          <div className={styles.inviteLinkContainer}>
            <div className={styles.linkDisplayBox}>
              <input 
                type="text" 
                readOnly 
                value={inviteLink || 'No active invite code'} 
                className={styles.linkInput}
                onClick={(e) => e.target.select()}
              />
              <button 
                type="button" 
                onClick={handleCopyInviteLink} 
                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                disabled={!inviteLink}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
            <p className={styles.inviteWarning}>
              Anyone with access to this link can join this private group. Keep it secure.
            </p>
          </div>
        </div>

        {/* CARD 3: ADD NEW MEMBERS */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>✉️</span>
            <div>
              <h3>Add Members</h3>
              <p className={styles.cardSubtitle}>Invite other classmates to join using their emails.</p>
            </div>
          </div>

          <form onSubmit={handleAddMember} className={styles.addMemberForm}>
            <div className={styles.inputGroupRow}>
              <input 
                type="email" 
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter classmate's email..."
                required
              />
              <button type="submit" className={styles.addBtn} disabled={isAddingMember}>
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>

            {addMemberMessage.text && (
              <p className={addMemberMessage.isError ? styles.errorMsg : styles.successMsg}>
                {addMemberMessage.text}
              </p>
            )}
          </form>
        </div>

        {/* CARD 4: MEMBERS LIST */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>👥</span>
            <div>
              <h3>Group Members ({members.length})</h3>
              <p className={styles.cardSubtitle}>See who's in the group and manage roles.</p>
            </div>
          </div>

          <div className={styles.membersListWrapper}>
            {members.map((member) => {
              const roleDisplay = member.role ? member.role.toUpperCase() : 'MEMBER';
              const isOwnerOrCreator = roleDisplay === 'OWNER' || roleDisplay === 'CREATOR';
              const isAlreadyAdmin = isOwnerOrCreator || roleDisplay === 'ADMIN';

              return (
                <div key={member.id} className={styles.memberRowItem}>
                  <div className={styles.memberIdentityCluster}>
                    <div className={styles.avatarMiniBadge}>
                      {member.fullName ? member.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className={styles.memberTextSpecs}>
                      <h4>{member.fullName || 'Anonymous User'}</h4>
                      <span>{member.email}</span>
                    </div>
                  </div>

                  <div className={styles.memberControlsCluster}>
                    <span className={`${styles.roleBadge} ${styles[roleDisplay.toLowerCase()] || styles.member}`}>
                      {roleDisplay === 'OWNER' || roleDisplay === 'CREATOR' ? 'Owner' : roleDisplay === 'ADMIN' ? 'Admin' : 'Member'}
                    </span>
                    
                    {!isAlreadyAdmin && (
                      <button 
                        type="button"
                        className={styles.promoteActionBtn}
                        onClick={() => promoteToAdmin(member.id)}
                      >
                        Make Admin
                      </button>
                    )}

                    {!isOwnerOrCreator && (
                      <button 
                        type="button"
                        className={styles.removeActionBtn}
                        onClick={() => handleRemoveMember(member.id, member.fullName)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}