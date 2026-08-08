import React, { useState } from "react";
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trash2,
  Plus,
  Link as LinkIcon,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import styles from "./Sidebar.module.css";

export default function Sidebar({
  groups,
  activeGroup,
  setActiveGroup,
  activeTab,
  setActiveTab,
  loading,
  error,
  userEmail,
  userDisplayName,
  userInitials,
  userAvatarUrl, // 👈 1. Pass the user's avatar URL here
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isDarkMode,
  setIsDarkMode,
  setIsNewGroupModalOpen,
  setIsJoinModalOpen,
  promptDeleteGroup,
  handleLogout,
}) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          ${styles.sidebar} 
          ${isSidebarCollapsed ? styles.collapsed : ""} 
          ${isMobileMenuOpen ? styles.mobileOpen : ""}
        `}
      >
        <div className={styles.sidebarTopRow}>
          <div
            className={styles.sidebarLogo}
            onClick={() => {
              if (groups.length > 0 && !activeGroup) {
                setActiveGroup(groups[0]);
              }
              setActiveTab("Overview");
              setIsMobileMenuOpen(false);
            }}
          >
            <GraduationCap className={styles.logoIcon} size={22} />
            <span className={styles.collapseHideText}>StudyCollab</span>
          </div>

          <button
            className={styles.collapseToggleBtn}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <div className={styles.sectionLabel}>
          <span className={styles.collapseHideText}>Study Groups</span>
        </div>

        {loading && groups.length === 0 ? (
          <p className={`${styles.collapseHideText} ${styles.loadingText}`}>
            Loading workspaces...
          </p>
        ) : error ? (
          <p className={`${styles.collapseHideText} ${styles.errorText}`}>
            Error loading groups.
          </p>
        ) : (
          <ul className={styles.groupList}>
            {groups.map((group) => {
              const currentMember = group.members?.find(
                (m) => m.email?.toLowerCase() === userEmail?.toLowerCase()
              );

              const roleStr = currentMember?.role
                ? currentMember.role.toString().toUpperCase()
                : "";
              const hasManagementRights =
                roleStr === "ADMIN" ||
                roleStr === "CREATOR" ||
                roleStr === "OWNER";
              const showDelete = hasManagementRights && !isSidebarCollapsed;

              return (
                <li
                  key={group.id}
                  className={`
                    ${styles.groupItem} 
                    ${
                      activeGroup?.id === group.id && activeTab !== "Settings"
                        ? styles.activeGroupItem
                        : ""
                    }
                  `}
                  onClick={() => {
                    setActiveGroup(group);
                    setActiveTab("Overview");
                    setIsMobileMenuOpen(false);
                  }}
                  title={group.name}
                >
                  <div className={styles.groupMainInfo}>
                    {group.avatarUrl ? (
                      <img
                        src={group.avatarUrl}
                        alt="avatar"
                        className={styles.groupAvatarImg}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <BookOpen className={styles.groupIcon} size={18} />
                    )}
                    <span className={styles.collapseHideText}>
                      {group.name}
                    </span>
                  </div>

                  {showDelete && (
                    <button
                      className={styles.deleteSidebarGroupBtn}
                      onClick={(e) => promptDeleteGroup(e, group)}
                      title="Delete Group"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Workspace Actions Container */}
        <div className={styles.sidebarActionButtons}>
          <button
            className={styles.newGroupBtn}
            title="New Group"
            onClick={() => {
              setIsNewGroupModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
          >
            <Plus className={styles.btnIcon} size={18} />
            <span className={styles.collapseHideText}> New Group</span>
          </button>

          <button
            className={`${styles.newGroupBtn} ${styles.joinGroupBtn || ""}`}
            title="Join via Link"
            onClick={() => {
              setIsJoinModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
          >
            <LinkIcon className={styles.btnIcon} size={18} />
            <span className={styles.collapseHideText}> Join Group</span>
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <div
            className={styles.footerAction}
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Theme"
          >
            {isDarkMode ? (
              <Sun className={styles.footerIcon} size={18} />
            ) : (
              <Moon className={styles.footerIcon} size={18} />
            )}
            <span className={styles.collapseHideText}>
              {isDarkMode ? " Light Mode" : " Dark Mode"}
            </span>
          </div>

          {/* 👈 2. Updated User Info Profile Card */}
          <div
            className={styles.userInfo}
            title="Account Settings"
            onClick={() => {
              setActiveTab("Settings");
              setIsMobileMenuOpen(false);
            }}
          >
            <div className={styles.userAvatar}>
              {userAvatarUrl && !avatarError ? (
                <img
                  src={userAvatarUrl}
                  alt={userDisplayName || "User Avatar"}
                  className={styles.userAvatarImg}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>
            <span
              className={`${styles.userEmailText} ${styles.collapseHideText}`}
            >
              {userDisplayName}
            </span>
          </div>

          <div
            className={`${styles.footerAction} ${styles.logoutAction}`}
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className={styles.footerIcon} size={18} />
            <span className={styles.collapseHideText}> Logout</span>
          </div>
        </div>
      </aside>
    </>
  );
}