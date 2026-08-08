import React, { useState, useEffect } from 'react';
import { Shield, LogOut, Loader2 } from 'lucide-react';
import { groupApi } from '../../../../api/groupApi';

import ConfirmModal from '../../../../components/common/ConfirmModal/ConfirmModal';
import GroupAvatarCard from './components/GroupAvatarCard';
import GroupDetailsCard from './components/GroupDetailsCard';
import MemberListCard from './components/MemberListCard';

import styles from './GroupSettingsPane.module.css';

export default function GroupSettingsPane({ 
  group, 
  currentUser, 
  onGroupUpdated, 
  onNavigateToAdmin,
  onLeaveSuccess
}) {
  const [members, setMembers] = useState(group?.members || []);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (group?.members) {
      setMembers(group.members);
    }
  }, [group]);

  const handleOpenAdminPanel = async () => {
    if (!onNavigateToAdmin || isNavigating) return;
    try {
      setIsNavigating(true);
      await onNavigateToAdmin();
    } catch (err) {
      console.error('Failed to navigate to admin panel:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleLeaveGroup = async () => {
    setIsSubmitting(true);
    setModalError('');
    try {
      await groupApi.leaveGroup(group.id);
      setIsLeaveModalOpen(false);
      
      if (onLeaveSuccess) {
        await onLeaveSuccess(group.id);
      }
    } catch (error) {
      setModalError(error.message || 'Failed to leave the group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.paneContainer}>
      <div className={styles.paneHeader}>
        <div className={styles.headerText}>
          <h2>Group Settings</h2>
          <p>View group details, see members, or manage your membership.</p>
        </div>

        <button
          type="button"
          className={styles.adminNavBtn}
          onClick={handleOpenAdminPanel}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Shield size={18} />
          )}
          {isNavigating ? 'Verifying...' : 'Open Admin Panel'}
        </button>
      </div>

      <div className={styles.settingsLayoutStack}>
        {/* Read-only Group Avatar */}
        <GroupAvatarCard
          group={group}
          isReadOnly={true}
        />

        {/* Read-only Group Details */}
        <GroupDetailsCard 
          group={group} 
          onGroupUpdated={onGroupUpdated} 
          isReadOnly={true} 
        />
        <MemberListCard members={members} readOnly />

        <div className={styles.userActionsCard}>
          <div className={styles.userActionsHeader}>
            <h3>Membership</h3>
            <p>Manage your association with this group.</p>
          </div>
          <button
            type="button"
            className={styles.leaveBtn}
            onClick={() => setIsLeaveModalOpen(true)}
          >
            <LogOut size={16} />
            Leave Group
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveGroup}
        title="Leave Study Group"
        message="Are you sure you want to leave this group? You will lose access to shared notes and tasks unless re-invited."
        confirmText="Leave Group"
        isDestructive={true}
        isLoading={isSubmitting}
        error={modalError}
      />
    </div>
  );
}