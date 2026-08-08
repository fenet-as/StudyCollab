// src/features/files/components/NoFilesFound.jsx
import React from 'react';
import { SearchX, FolderOpen } from 'lucide-react';
import styles from './NoFilesFound.module.css';

export default function NoFilesFound({ isFiltered = false }) {
  return (
    <div className={styles.minimalContainer}>
      <span className={styles.icon}>
        {isFiltered ? <SearchX size={20} /> : <FolderOpen size={20} />}
      </span>
      <span className={styles.text}>
        {isFiltered ? 'No matching files found.' : 'No files uploaded yet.'}
      </span>
    </div>
  );
}