import React from "react";
import { X } from "lucide-react";
import styles from "./MemberList.module.css";

export default function MemberList({ isOpen = true, onClose }) {
  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && onClose && (
        <div className={styles.mobileBackdrop} onClick={onClose} />
      )}

      <aside
        className={`${styles.membersSidebar} ${
          isOpen ? styles.drawerOpen : ""
        }`}
      >
        <div className={styles.sidebarHeader}>
          <h4>Workspace Members</h4>
          {onClose && (
            <button
              className={styles.closeDrawerBtn}
              onClick={onClose}
              aria-label="Close members pane"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className={styles.memberList}>
          <div className={styles.memberCard}>
            <div className={`${styles.memberAvatar} ${styles.online}`}>SC</div>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>Sarah Chen</span>
              <span className={styles.memberRole}>Admin</span>
            </div>
          </div>

          <div className={styles.memberCard}>
            <div className={`${styles.memberAvatar} ${styles.online}`}>AR</div>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>Alex Rivera</span>
              <span className={styles.memberRole}>Member</span>
            </div>
          </div>

          <div className={styles.memberCard}>
            <div className={`${styles.memberAvatar} ${styles.offline}`}>ME</div>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>You</span>
              <span className={styles.memberRole}>Owner</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}