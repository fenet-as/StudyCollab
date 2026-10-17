import React from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import styles from "./MobileHeader.module.css";

export default function MobileHeader({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  setActiveTab,
  userInitials,
}) {
  return (
    <div className={styles.mobileHeader}>
      <button
        className={styles.hamburgerBtn}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <button
        type="button"
        className={styles.mobileLogo}
        onClick={() => setActiveTab("Overview")}
        aria-label="Go to Overview"
      >
        <GraduationCap size={20} />
        <span>StudyCollab</span>
      </button>

      <button
        type="button"
        className={styles.userAvatar}
        onClick={() => {
          setActiveTab("Settings");
          setIsMobileMenuOpen(false);
        }}
        aria-label="Open Account Settings"
      >
        {userInitials}
      </button>
    </div>
  );
}