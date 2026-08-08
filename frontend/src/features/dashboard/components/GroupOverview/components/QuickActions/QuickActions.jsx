import React from 'react';
import { FileText, Plus, Upload, Users } from 'lucide-react';
import styles from './QuickActions.module.css';

export default function QuickActions({ onOpenModal, handleTabChange, handleGoToGroupSettings }) {
  return (
    <div className={`${styles.card} ${styles.spanTwo}`}>
      <div className={styles.cardHeader}>
        <h3>Quick Actions</h3>
      </div>
      <div className={styles.actionsGrid}>
        <button
          className={styles.primaryActionBtn}
          onClick={() => (onOpenModal ? onOpenModal('note') : handleTabChange('Notes'))}
        >
          <FileText size={18} /> New Note
        </button>
        <button
          className={styles.primaryActionBtn}
          onClick={() => (onOpenModal ? onOpenModal('task') : handleTabChange('Tasks'))}
        >
          <Plus size={18} /> Add Task
        </button>
        <button
          className={styles.primaryActionBtn}
          onClick={() => (onOpenModal ? onOpenModal('file') : handleTabChange('Files'))}
        >
          <Upload size={18} /> Upload File
        </button>
        <button
          className={styles.accentActionBtn}
          onClick={handleGoToGroupSettings}
        >
          <Users size={18} /> Invite Member
        </button>
      </div>
    </div>
  );
}