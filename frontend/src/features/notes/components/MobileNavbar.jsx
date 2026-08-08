import React from 'react';
import { Menu, X } from 'lucide-react';
import styles from './MobileNavbar.module.css';

export default function MobileNavbar({ isSidebarOpen, onToggleSidebar, title }) {
  return (
    <div className={styles.mobileNavbar}>
      <button className={styles.menuToggleBtn} onClick={onToggleSidebar}>
        {isSidebarOpen ? (
          <>
            <X size={18} /> Close List
          </>
        ) : (
          <>
            <Menu size={18} /> Show Notes
          </>
        ) }
      </button>
      <span className={styles.mobileNavTitle}>{title || 'Notes'}</span>
    </div>
  );
}