import React from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '../../../../../../utils/validators';
import styles from './RecentFiles.module.css';

export default function RecentFiles({ recentFiles, handleTabChange }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>Recent Files</h3>
        <button className={styles.viewAllBtn} onClick={() => handleTabChange('Files')}>
          View All
        </button>
      </div>
      <div className={styles.cardContent}>
        {!recentFiles || recentFiles.length === 0 ? (
          <p className={styles.emptyState}>No files uploaded yet</p>
        ) : (
          recentFiles.map((file) => (
            <button 
              key={file.id} 
              type="button"
              className={styles.listRow}
              onClick={() => handleTabChange('Files')}
              aria-label={`View file ${file.name} in Files`}
            >
              <div className={styles.rowLeft}>
                <span className={styles.rowIcon}>
                  <Folder size={18} />
                </span>
                <div>
                  <p className={styles.itemTitle}>{file.name}</p>
                  <span className={styles.itemMeta}>
                    {file.categoryName || 'General'} • Uploaded {formatRelativeTime(file.createdAt)}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className={styles.arrowIcon} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}