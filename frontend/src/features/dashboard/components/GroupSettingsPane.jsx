import React, { useState, useEffect } from 'react';
import { groupApi } from '../../../api/groupApi';

// Generic ConfirmModal
import ConfirmModal from '../../../components/common/ConfirmModal/ConfirmModal';
import styles from './GroupSettingsPane.module.css';

export default function GroupSettingsPane({ group, onGroupUpdated }) {
  // Mode toggling for Name & Description
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [infoMessage, setInfoMessage] = useState({ text: '', isError: false });
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // Members Management States
  const [members, setMembers] = useState(group?.members || []);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberMessage, setAddMemberMessage] = useState({ text: '', isError: false });
  const [isAddingMember, setIsAddingMember] = useState(false);

  // General Notification Banner (Replaces alert popups)
  const [paneNotification, setPaneNotification] = useState({ text: '', isError: false });

  // Confirmation Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState(null); // 'REMOVE' or 'DEMOTE'
  const [pendingMember, setPendingMember] = useState(null); // stores { id, name }
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(''); // Stores validation/API errors specifically for the modal

  // Tracks which member row's 3-dot menu is open (using userId)
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Invitation / Link State
  const [copied, setCopied] = useState(false);
  const inviteLink = group?.inviteCode 
    ? `${window.location.origin}/join/${group.inviteCode}` 
    : '';

  // Synchronize component state with prop updates
  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setDescription(group.description || '');
      setMembers(group.members || []);
    }
  }, [group]);

  // Click outside listener to close any open 3-dot dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(`.${styles.dropdownContainer}`)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Automatically fade out general banner notifications after 5 seconds
  useEffect(() => {
    if (paneNotification.text) {
      const timer = setTimeout(() => {
        setPaneNotification({ text: '', isError: false });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paneNotification]);

  const handleCopyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleDropdown = (memberId) => {
    setActiveDropdownId(activeDropdownId === memberId ? null : memberId);
  };

  // API: Save Name & Description
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingInfo(true);
    setInfoMessage({ text: '', isError: false });

    try {
      const updatedDetails = await groupApi.updateGroupDetails(group.id, {
        name: groupName,
        description: description
      });

      setInfoMessage({ text: 'Group details saved successfully!', isError: false });
      setIsEditing(false);

      if (onGroupUpdated) {
        const mergedGroup = {
          ...group,
          name: updatedDetails.name || groupName,
          description: description
        };
        onGroupUpdated(mergedGroup);
      }
    } catch (error) {
      setInfoMessage({ text: error.message || 'Failed to update details.', isError: true });
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleCancelEdit = () => {
    setGroupName(group?.name || '');
    setDescription(group?.description || '');
    setInfoMessage({ text: '', isError: false });
    setIsEditing(false);
  };

  // API: Add member
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setIsAddingMember(true);
    setAddMemberMessage({ text: '', isError: false });

    try {
      const updatedGroup = await groupApi.addMemberByEmail(group.id, newMemberEmail);
      
      setMembers(updatedGroup.members || []);
      setNewMemberEmail('');
      setAddMemberMessage({ text: 'Member added successfully!', isError: false });
      
      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }
    } catch (error) {
      setAddMemberMessage({ text: error.message || 'Could not add member.', isError: true });
    } finally {
      setIsAddingMember(false);
    }
  };

  // API: Promote member to Admin
  const handlePromoteToAdmin = async (memberUserId) => {
    setActiveDropdownId(null);
    try {
      const updatedGroup = await groupApi.promoteMemberToAdmin(group.id, memberUserId);
      setMembers(updatedGroup.members || []);
      setPaneNotification({ text: 'Member successfully promoted to Administrator!', isError: false });
      
      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }
    } catch (error) {
      setPaneNotification({ text: error.message || 'Could not promote member.', isError: true });
    }
  };

  // Open Confirmation Modal for Demoting Admin
  const handleDemoteMemberClick = (memberUserId, memberName) => {
    setActiveDropdownId(null);
    setModalError('');
    setModalActionType('DEMOTE');
    setPendingMember({ id: memberUserId, name: memberName });
    setIsConfirmOpen(true);
  };

  // Open Confirmation Modal for Removing Member
  const handleRemoveMemberClick = (memberUserId, memberName) => {
    setActiveDropdownId(null);
    setModalError('');
    setModalActionType('REMOVE');
    setPendingMember({ id: memberUserId, name: memberName });
    setIsConfirmOpen(true);
  };

  // Unified execution trigger from custom Confirmation Modal
  const handleModalConfirmAction = async () => {
    if (!pendingMember || !modalActionType) return;
    setIsModalSubmitting(true);
    setModalError('');

    try {
      let updatedGroup;

      if (modalActionType === 'REMOVE') {
        updatedGroup = await groupApi.removeMember(group.id, pendingMember.id);
        setPaneNotification({ 
          text: `${pendingMember.name || 'Member'} has been removed from the group.`, 
          isError: false 
        });
      } else if (modalActionType === 'DEMOTE') {
        updatedGroup = await groupApi.demoteAdminToMember(group.id, pendingMember.id);
        setPaneNotification({ 
          text: `${pendingMember.name || 'Administrator'} has been demoted to a regular member.`, 
          isError: false 
        });
      }

      setMembers(updatedGroup.members || []);
      if (onGroupUpdated) {
        onGroupUpdated(updatedGroup);
      }
      
      // Close modal on SUCCESS ONLY
      setIsConfirmOpen(false);
      setPendingMember(null);
      setModalActionType(null);
    } catch (error) {
      // KEEP modal open and render error inside context wrapper
      setModalError(error.message || `Failed to complete operation. You might not have authorization.`);
    } finally {
      setIsModalSubmitting(false);
    }
  };

  return (
    <div className={styles.paneContainer}>
      <div className={styles.paneHeader}>
        <h2>Group Settings</h2>
        <p>Manage details, invite direct classmates, and assign administrative roles.</p>
      </div>

      {/* Pane-level notification banner */}
      {paneNotification.text && (
        <div className={`${styles.toastNotification} ${paneNotification.isError ? styles.toastError : styles.toastSuccess}`}>
          <span>{paneNotification.isError ? '❌' : '✅'}</span>
          <p>{paneNotification.text}</p>
        </div>
      )}

      <div className={styles.settingsLayoutStack}>
        
        {/* CARD 1: GROUP DETAILS */}
        <div className={`${styles.settingsCard} ${isEditing ? styles.editingActive : ''}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>✏️</span>
            <div className={styles.cardHeaderTitleBlock}>
              <div>
                <h3>Group Details</h3>
                <p className={styles.cardSubtitle}>The core identity and settings of your study group.</p>
              </div>
              {!isEditing && (
                <button 
                  type="button" 
                  className={styles.editToggleBtn} 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Details
                </button>
              )}
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
                readOnly={!isEditing}
                className={!isEditing ? styles.readOnlyInput : styles.editableInputActive}
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
                readOnly={!isEditing}
                className={!isEditing ? styles.readOnlyInput : styles.editableInputActive}
                placeholder="What is this group about?"
              />
            </div>

            {infoMessage.text && (
              <div style={{ alignSelf: 'flex-start' }}>
                <p className={infoMessage.isError ? styles.errorMsg : styles.successMsg}>
                  {infoMessage.text}
                </p>
              </div>
            )}

            {isEditing && (
              <div className={styles.formActionsRow}>
                <button type="submit" className={styles.saveBtn} disabled={isUpdatingInfo}>
                  {isUpdatingInfo ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit} disabled={isUpdatingInfo}>
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* CARD 2: SHARE INVITE LINK */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🔗</span>
            <div>
              <h3>Invite Link</h3>
              <p className={styles.cardSubtitle}>Share this direct private join link with your class members.</p>
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
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <p className={styles.inviteWarning}>
              Caution: Anyone with this unique join URL can join immediately. Keep it within trusted circles.
            </p>
          </div>
        </div>

        {/* CARD 3: ADD NEW MEMBERS */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>👤</span>
            <div>
              <h3>Add Members</h3>
              <p className={styles.cardSubtitle}>Instantly add classmates by email address.</p>
            </div>
          </div>

          <form onSubmit={handleAddMemberSubmit} className={styles.addMemberForm}>
            <div className={styles.inputGroupRow}>
              <input 
                type="email" 
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter classmate's system email address..."
                required
              />
              <button type="submit" className={styles.addBtn} disabled={isAddingMember}>
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>

            {addMemberMessage.text && (
              <div style={{ alignSelf: 'flex-start' }}>
                <p className={addMemberMessage.isError ? styles.errorMsg : styles.successMsg}>
                  {addMemberMessage.text}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* CARD 4: MEMBERS LIST */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>👥</span>
            <div>
              <h3>Group Members ({members.length})</h3>
              <p className={styles.cardSubtitle}>See who's in your group and manage administrative permissions.</p>
            </div>
          </div>

          <div className={styles.membersListWrapper}>
            {members.length === 0 ? (
              <div className={styles.emptyMembersBox}>No members currently in this group.</div>
            ) : (
              members.map((member) => {
                const targetUserId = member.userId || member.id;
                const roleDisplay = member.role ? member.role.toUpperCase() : 'MEMBER';
                const isOwnerOrCreator = roleDisplay === 'OWNER' || roleDisplay === 'CREATOR';
                const isAlreadyAdmin = isOwnerOrCreator || roleDisplay === 'ADMIN';

                return (
                  <div key={targetUserId} className={styles.memberRowItem}>
                    <div className={styles.memberIdentityCluster}>
                      <div className={styles.avatarMiniBadge}>
                        {member.fullName ? member.fullName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className={styles.memberTextSpecs}>
                        <h4>{member.fullName || 'Registered Student'}</h4>
                        <span>{member.email}</span>
                      </div>
                    </div>

                    <div className={styles.memberControlsCluster}>
                      <span className={`${styles.roleBadge} ${styles[roleDisplay.toLowerCase()] || styles.member}`}>
                        {roleDisplay === 'OWNER' || roleDisplay === 'CREATOR' ? 'Owner' : roleDisplay === 'ADMIN' ? 'Admin' : 'Member'}
                      </span>
                      
                      {/* Modern Dropdown */}
                      <div className={styles.dropdownContainer}>
                        <button 
                          type="button" 
                          className={styles.threeDotsBtn} 
                          onClick={() => toggleDropdown(targetUserId)}
                          aria-label="Manage member"
                        >
                          ⋮
                        </button>
                        
                        {activeDropdownId === targetUserId && (
                          <div className={styles.actionDropdownMenu}>
                            <div className={styles.dropdownHeader}>Actions</div>
                            
                            {!isAlreadyAdmin && (
                              <button 
                                type="button" 
                                className={styles.dropdownItemBtn}
                                onClick={() => handlePromoteToAdmin(targetUserId)}
                              >
                                <span className={styles.actionIcon}>⚡</span> Make Admin
                              </button>
                            )}

                            {roleDisplay === 'ADMIN' && !isOwnerOrCreator && (
                              <button 
                                type="button" 
                                className={styles.dropdownItemBtn}
                                onClick={() => handleDemoteMemberClick(targetUserId, member.fullName)}
                              >
                                <span className={styles.actionIcon}>⬇️</span> Demote to Member
                              </button>
                            )}

                            {!isOwnerOrCreator && (
                              <button 
                                type="button" 
                                className={`${styles.dropdownItemBtn} ${styles.destructive}`}
                                onClick={() => handleRemoveMemberClick(targetUserId, member.fullName)}
                              >
                                <span className={styles.actionIcon}>🗑️</span> Remove Member
                              </button>
                            )}
                            
                            {isAlreadyAdmin && isOwnerOrCreator && (
                              <div className={styles.disabledDropdownNotice}>No actions available</div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================== */}
      {/*                       MODAL INTEGRATION ZONE                               */}
      {/* ========================================================================== */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setPendingMember(null);
          setModalActionType(null);
          setModalError('');
        }}
        onConfirm={handleModalConfirmAction}
        title={modalActionType === 'DEMOTE' ? "Demote Administrator" : "Remove Group Member"}
        message={
          modalActionType === 'DEMOTE'
            ? `Are you sure you want to demote ${pendingMember?.name || 'this administrator'} back to a regular member? They will lose access to administrative dashboard configurations.`
            : `Are you sure you want to remove ${pendingMember?.name || 'this student'} from the study group? They will lose access to all notes and tasks.`
        }
        confirmText={modalActionType === 'DEMOTE' ? "Demote Admin" : "Remove Member"}
        isDestructive={true}
        isLoading={isModalSubmitting}
        error={modalError} 
      />

    </div>
  );
}