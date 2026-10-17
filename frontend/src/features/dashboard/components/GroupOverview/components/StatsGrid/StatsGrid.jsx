import React from 'react';
import { FileText, Clock, CheckCircle2, Folder, Users } from 'lucide-react';
import styles from './StatsGrid.module.css';

export default function StatsGrid({ stats, handleTabChange }) {
  const statsCards = [
    { label: 'Total Notes', value: stats?.totalNotes ?? 0, icon: <FileText size={20} />, tab: 'Notes' },
    { label: 'Pending Tasks', value: stats?.pendingTasks ?? 0, icon: <Clock size={20} />, tab: 'Tasks' },
    { label: 'Completed Tasks', value: stats?.completedTasks ?? 0, icon: <CheckCircle2 size={20} />, tab: 'Tasks' },
    { label: 'Files', value: stats?.totalFiles ?? 0, icon: <Folder size={20} />, tab: 'Files' },
    { label: 'Members', value: stats?.totalMembers ?? 0, icon: <Users size={20} />, tab: 'Group Settings' },
  ];

  return (
    <div className={styles.statsGrid}>
      {statsCards.map((stat, i) => (
        <button 
          key={i} 
          type="button"
          className={styles.statCard} 
          onClick={() => handleTabChange(stat.tab)}
          title={`Go to ${stat.tab}`}
          aria-label={`${stat.label}: ${stat.value}. Go to ${stat.tab}`}
        >
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statIcon}>{stat.icon}</span>
          </div>
          <div className={styles.statValue}>{stat.value}</div>
        </button>
      ))}
    </div>
  );
}