import React from 'react';
import styles from './GroupOverview.module.css';

export default function GroupOverview({ setActiveTab }) {
  // Mock data matching specification
  const stats = [
    { label: 'Total Notes', value: 42, icon: '📄' },
    { label: 'Pending Tasks', value: 15, icon: '🕒' },
    { label: 'Completed Tasks', value: 28, icon: '✅' },
    { label: 'Files', value: 110, icon: '📁' },
    { label: 'Members', value: 12, icon: '👥' },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Finish ER Diagram', dueDate: 'Tomorrow', priority: 'HIGH' },
    { id: 2, title: 'Prepare for OOP Quiz', dueDate: 'In 2 days', priority: 'MEDIUM' },
  ];

  const recentNotes = [
    { id: 1, title: 'Database Normalization Notes', edited: '33 mins ago', author: 'John Doe' },
    { id: 2, title: 'B-Trees & Indexing Strategy', edited: '1 day ago', author: 'Jane Smith' },
  ];

  const recentFiles = [
    { id: 1, name: 'Assignment_2_Draft.pdf', subject: 'Database', date: 'Uploaded 5 mins ago' },
    { id: 2, name: 'ER_Diagram_v2.png', subject: 'Database', date: 'Uploaded 1 hour ago' },
  ];

  const members = [
    { name: 'John Doe', avatar: '👩' },
    { name: 'Jane Smith', avatar: '👨' },
    { name: 'Alex Kim', avatar: '👩' },
    { name: 'Sarah Ahmed', avatar: '👨' },
  ];

  return (
    <div className={styles.overviewContainer}>
      {/* Statistics Row */}
      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statIcon}>{stat.icon}</span>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className={styles.dashboardGrid}>
        {/* Upcoming Tasks */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Upcoming Tasks</h3>
            <button className={styles.viewAllBtn} onClick={() => setActiveTab('Tasks')}>
              View All Tasks
            </button>
          </div>
          <div className={styles.cardContent}>
            {upcomingTasks.map((task) => (
              <div key={task.id} className={styles.taskRow}>
                <div className={styles.taskInfo}>
                  <span className={styles.radioPlaceholder}>○</span>
                  <div>
                    <p className={styles.itemTitle}>{task.title}</p>
                    <span className={styles.itemMeta}>{task.dueDate}</span>
                  </div>
                </div>
                <span className={`${styles.badge} ${styles[task.priority.toLowerCase()]}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notes */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Notes</h3>
          </div>
          <div className={styles.cardContent}>
            {recentNotes.map((note) => (
              <div key={note.id} className={styles.listRow}>
                <div className={styles.rowLeft}>
                  <span className={styles.rowIcon}>📄</span>
                  <div>
                    <p className={styles.itemTitle}>{note.title}</p>
                    <span className={styles.itemMeta}>Edited {note.edited} • by {note.author}</span>
                  </div>
                </div>
                <span className={styles.arrowIcon}>›</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Recent Files</h3>
          </div>
          <div className={styles.cardContent}>
            {recentFiles.map((file) => (
              <div key={file.id} className={styles.listRow}>
                <div className={styles.rowLeft}>
                  <span className={styles.rowIcon}>📁</span>
                  <div>
                    <p className={styles.itemTitle}>{file.name}</p>
                    <span className={styles.itemMeta}>{file.subject} • {file.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Members Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Members</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.membersGrid}>
              {members.map((m, idx) => (
                <div key={idx} className={styles.memberAvatarCircle} title={m.name}>
                  <span className={styles.avatarEmoji}>{m.avatar}</span>
                  <span className={styles.memberNameLabel}>{m.name.split(' ')[0]}</span>
                </div>
              ))}
              <div className={`${styles.memberAvatarCircle} ${styles.moreCircle}`}>
                <span>+8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className={`${styles.card} ${styles.spanTwo}`}>
          <div className={styles.cardHeader}>
            <h3>Quick Actions</h3>
          </div>
          <div className={styles.actionsGrid}>
            <button className={styles.primaryActionBtn}>
              <span className={styles.actionIcon}>📝</span> New Note
            </button>
            <button className={styles.primaryActionBtn}>
              <span className={styles.actionIcon}>➕</span> Add Task
            </button>
            <button className={styles.primaryActionBtn}>
              <span className={styles.actionIcon}>📤</span> Upload File
            </button>
            <button className={styles.accentActionBtn}>
              <span className={styles.actionIcon}>👥</span> Invite Member
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}