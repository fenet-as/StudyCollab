import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '../../../../../../utils/validators';
import styles from './RecentNotes.module.css';

export default function RecentNotes({ recentNotes, handleTabChange }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>Recent Notes</h3>
        <button className={styles.viewAllBtn} onClick={() => handleTabChange('Notes')}>
          View All
        </button>
      </div>
      <div className={styles.cardContent}>
        {!recentNotes || recentNotes.length === 0 ? (
          <p className={styles.emptyState}>No notes created yet</p>
        ) : (
          recentNotes.map((note) => (
            <div 
              key={note.id} 
              className={styles.listRow}
              onClick={() => handleTabChange('Notes')}
            >
              <div className={styles.rowLeft}>
                <span className={styles.rowIcon}>
                  <FileText size={18} />
                </span>
                <div>
                  <p className={styles.itemTitle}>{note.title}</p>
                  <span className={styles.itemMeta}>
                    Edited {formatRelativeTime(note.updatedAt)} • by {note.authorName || 'Unknown'}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className={styles.arrowIcon} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}