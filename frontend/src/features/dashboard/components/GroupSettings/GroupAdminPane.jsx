import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, ShieldAlert } from 'lucide-react';
import { groupApi } from '../../../../api/groupApi';

import ConfirmModal from '../../../../components/common/ConfirmModal/ConfirmModal';
import DeleteConfirmModal from '../../../../components/interactive/DeleteConfirmModal/DeleteConfirmModal';

import GroupAvatarCard from './components/GroupAvatarCard';
import GroupDetailsCard from './components/GroupDetailsCard';
import InviteLinkCard from './components/InviteLinkCard';
import AddMemberCard from './components/AddMemberCard';
import MemberListCard from './components/MemberListCard';

import styles from './AdminPanel.module.css';

export default function GroupAdminPane({
  group,
  currentUser,
  onGroupUpdated,
  onBack,
  onGroupDeleted,
}) {
  const [members, setMembers] = useState(group?.members || []);
  const [permissions, setPermissions] = useState({
    isOwnerOrAdmin: false,
    isCreator: false,
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState(null);
  const [pendingMember, setPendingMember] = useState(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (group?.members) {
      setMembers(group.members);
    }
  }, [group?.members]);

  useEffect(() => {
    if (group?.id) {
      setLoadingPermissions(true);
      groupApi
        .getGroupPermissions(group.id)
        .then((res) => {
          setPermissions({
            isOwnerOrAdmin: res.isOwnerOrAdmin ?? res.ownerOrAdmin ?? false,
            isCreator: res.isCreator ?? res.creator ?? false,
          });
        })
        .catch((err) => {
          console.error('Failed to verify admin panel permissions:', err);
          setPermissions({ isOwnerOrAdmin: false, isCreator: false });
        })
        .finally(() => setLoadingPermissions(false));
    }
  }, [group?.id]);

  if (!loadingPermissions && !permissions.isOwnerOrAdmin) {
    return (
      <div className={styles.paneContainer}>
        <div className={styles.paneHeader}>
          <button type="button" className={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={16} /> Back to Group Settings
          </button>
        </div>
        <div className={styles.accessDeniedCard}>
          <div className={styles.accessDeniedIconWrapper}>
            <ShieldAlert size={48} className={styles.accessDeniedIcon} />
          </div>
          <h3>Access Denied</h3>
          <p>
            You do not have permission to view this section. Only group
            administrators and owners can access the Admin Management Panel.
          </p>
          <button type="button" className={styles.backBtn} onClick={onBack}>
            Return to Group Settings
          </button>
        </div>
      </div>
    );
  }

  const handlePromoteToAdmin = async (memberUserId) => {
    try {
      const updatedGroup = await groupApi.promoteMemberToAdmin(
        group.id,
        memberUserId
      );
      setMembers(updatedGroup.members || []);
      if (onGroupUpdated) onGroupUpdated(updatedGroup);
    } catch (error) {
      console.error(error.message || 'Could not promote member.');
      throw error;
    }
  };

  const handleOpenDemoteModal = (memberUserId, memberName) => {
    setModalError('');
    setModalActionType('DEMOTE');
    setPendingMember({ id: memberUserId, name: memberName });
    setIsConfirmOpen(true);
  };

  const handleOpenRemoveModal = (memberUserId, memberName) => {
    setModalError('');
    setModalActionType('REMOVE');
    setPendingMember({ id: memberUserId, name: memberName });
    setIsConfirmOpen(true);
  };

  const handleDeleteGroupConfirm = async () => {
    try {
      if (onGroupDeleted) {
        await onGroupDeleted(group.id);
      } else {
        await groupApi.deleteGroup(group.id);
        onBack();
      }
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete group from admin panel:', error);
      throw error;
    }
  };

  const handleModalConfirmAction = async () => {
    setIsModalSubmitting(true);
    setModalError('');

    try {
      if (modalActionType === 'REMOVE') {
        const updatedGroup = await groupApi.removeMember(
          group.id,
          pendingMember.id
        );
        setMembers(updatedGroup.members || []);
        if (onGroupUpdated) onGroupUpdated(updatedGroup);
      } else if (modalActionType === 'DEMOTE') {
        const updatedGroup = await groupApi.demoteAdminToMember(
          group.id,
          pendingMember.id
        );
        setMembers(updatedGroup.members || []);
        if (onGroupUpdated) onGroupUpdated(updatedGroup);
      }

      setIsConfirmOpen(false);
      setPendingMember(null);
      setModalActionType(null);
    } catch (error) {
      setModalError(error.message || 'Failed to complete action.');
    } finally {
      setIsModalSubmitting(false);
    }
  };

  return (
    <div className={styles.paneContainer}>
      <div className={styles.paneHeader}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back to Group Settings
        </button>
        <div className={styles.titleWrapper}>
          <h2>Admin Management Panel</h2>
          <p>
            Perform administrative operations, update roles, or manage group
            access.
          </p>
        </div>
      </div>

      <div className={styles.settingsLayoutStack}>
        {/* Editable Avatar Management in Admin Panel */}
        <GroupAvatarCard
          group={group}
          onAvatarUpdated={(newAvatarUrl) => {
            if (onGroupUpdated) {
              onGroupUpdated({ ...group, avatarUrl: newAvatarUrl, avatar: newAvatarUrl });
            }
          }}
          isReadOnly={false}
        />

        {/* Editable Group Details in Admin Panel */}
        <GroupDetailsCard 
          group={group} 
          onGroupUpdated={onGroupUpdated} 
          isReadOnly={false} 
        />

        {/* Invite Link */}
        <InviteLinkCard inviteCode={group?.inviteCode} />

        {/* Add Member */}
        <AddMemberCard
          groupId={group?.id}
          onMemberAdded={(updatedGroup) => {
            setMembers(updatedGroup.members || []);
            if (onGroupUpdated) onGroupUpdated(updatedGroup);
          }}
        />

        {/* Member Management with full admin capabilities */}
        <MemberListCard
          members={members}
          currentUser={currentUser}
          onPromote={handlePromoteToAdmin}
          onDemote={handleOpenDemoteModal}
          onRemove={handleOpenRemoveModal}
          readOnly={false}
        />

        {/* Owner Danger Zone - Delete Group */}
        {permissions.isCreator && (
          <div className={styles.dangerZoneCard}>
            <div className={styles.cardHeader}>
              <div className={styles.dangerIconWrapper}>
                <AlertTriangle className={styles.dangerIcon} size={20} />
              </div>
              <div className={styles.dangerHeaderText}>
                <h3>Delete Group</h3>
                <p>
                  Permanently remove this group and all associated resources.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Group
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleModalConfirmAction}
        title={
          modalActionType === 'DEMOTE'
            ? 'Demote Administrator'
            : 'Remove Group Member'
        }
        message={
          modalActionType === 'DEMOTE'
            ? `Are you sure you want to demote ${pendingMember?.name || 'this admin'}?`
            : `Are you sure you want to remove ${pendingMember?.name || 'this member'}?`
        }
        confirmText={
          modalActionType === 'DEMOTE' ? 'Demote Admin' : 'Remove Member'
        }
        isDestructive={true}
        isLoading={isModalSubmitting}
        error={modalError}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        groupName={group?.name || ''}
        onConfirm={handleDeleteGroupConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}