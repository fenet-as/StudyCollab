import React from 'react';
import styles from './UpcomingTasks.module.css';

export default function UpcomingTasks({ upcomingTasks, handleTabChange }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>Upcoming Tasks</h3>
        <button className={styles.viewAllBtn} onClick={() => handleTabChange('Tasks')}>
          View All →
        </button>
      </div>

      <div className={styles.cardContent}>
        {!upcomingTasks || upcomingTasks.length === 0 ? (
          <p className={styles.emptyState}>No upcoming tasks</p>
        ) : (
          upcomingTasks.map((task) => {
            const assignee = task.assigneeName || task.assignee || 'Unassigned';
            const priorityLower = task.priority?.toLowerCase() || 'medium';

            return (
              <button 
                key={task.id} 
                type="button"
                className={styles.taskRow}
                onClick={() => handleTabChange('Tasks')}
                aria-label={`View task ${task.title} in Tasks`}
              >
                <div className={styles.rowMain}>
                  <div className={styles.titleGroup}>
                    <p className={styles.itemTitle}>{task.title}</p>
                    <span className={`${styles.prioBadge} ${styles[priorityLower]}`}>
                      {task.priority || 'MEDIUM'}
                    </span>
                  </div>
                  <div className={styles.metaRow}>
<span>
  {task.dueDate
    ? `Due ${new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`
    : 'No due date'}
</span>
                    <span className={styles.dot}>•</span>
                    <span>To: <strong>{assignee}</strong></span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}