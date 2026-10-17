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
  // Groups & Navigation
  groups = [],
  activeGroup = null,
  onSelectGroup,
  setActiveGroup = onSelectGroup,
  activeTab = "Overview",
  onSelectTab,
  setActiveTab = onSelectTab,
  loading = false,
  error = null,

  // User Profile
  currentUser,
  user = currentUser,
  userEmail,
  userDisplayName,
  userInitials,
  userAvatarUrl,

  // Sidebar Layout & Responsive State
  isCollapsed,
  isSidebarCollapsed = isCollapsed,
  onToggleCollapse,
  setIsSidebarCollapsed = onToggleCollapse,
  isMobileOpen,
  isMobileMenuOpen = isMobileOpen,
  onCloseMobile,
  setIsMobileMenuOpen = onCloseMobile,

  // Theme & Actions
  isDarkMode = false,
  onToggleTheme,
  setIsDarkMode = onToggleTheme,
  onNewGroup,
  setIsNewGroupModalOpen,
  onJoinGroup,
  setIsJoinModalOpen,
  onDeleteGroup,
  promptDeleteGroup = onDeleteGroup,
  onLogout,
  handleLogout = onLogout,
}) {
  const resolvedEmail = user?.email || currentUser?.email || userEmail || "";
  const resolvedDisplayName =
    user?.displayName ||
    currentUser?.displayName ||
    user?.fullName ||
    currentUser?.fullName ||
    userDisplayName ||
    (resolvedEmail ? resolvedEmail.split("@")[0] : "User");
  const resolvedInitials =
    user?.initials ||
    currentUser?.initials ||
    userInitials ||
    (resolvedDisplayName ? resolvedDisplayName.charAt(0).toUpperCase() : "U");
  const resolvedAvatarUrl =
    user?.avatarUrl || currentUser?.avatarUrl || userAvatarUrl || null;

  const [avatarError, setAvatarError] = useState(false);
  const [prevAvatarUrl, setPrevAvatarUrl] = useState(resolvedAvatarUrl);

  if (resolvedAvatarUrl !== prevAvatarUrl) {
    setPrevAvatarUrl(resolvedAvatarUrl);
    setAvatarError(false);
  }

  const handleGroupSelect = (group) => {
    if (typeof setActiveGroup === "function") {
      setActiveGroup(group);
    }
    if (typeof setActiveTab === "function") {
      setActiveTab("Overview");
    }
    if (typeof setIsMobileMenuOpen === "function") {
      setIsMobileMenuOpen(false);
    }
  };

  const handleToggleCollapse = () => {
    if (typeof onToggleCollapse === "function") {
      onToggleCollapse();
    } else if (typeof setIsSidebarCollapsed === "function") {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleOpenNewGroup = () => {
    if (typeof onNewGroup === "function") {
      onNewGroup();
    } else if (typeof setIsNewGroupModalOpen === "function") {
      setIsNewGroupModalOpen(true);
      if (typeof setIsMobileMenuOpen === "function") {
        setIsMobileMenuOpen(false);
      }
    }
  };

  const handleOpenJoinGroup = () => {
    if (typeof onJoinGroup === "function") {
      onJoinGroup();
    } else if (typeof setIsJoinModalOpen === "function") {
      setIsJoinModalOpen(true);
      if (typeof setIsMobileMenuOpen === "function") {
        setIsMobileMenuOpen(false);
      }
    }
  };

  const handleThemeToggle = () => {
    if (typeof onToggleTheme === "function") {
      onToggleTheme();
    } else if (typeof setIsDarkMode === "function") {
      setIsDarkMode(!isDarkMode);
    }
  };

  const handleCloseMobileMenu = () => {
    if (typeof onCloseMobile === "function") {
      onCloseMobile();
    } else if (typeof setIsMobileMenuOpen === "function") {
      setIsMobileMenuOpen(false);
    }
  };

  const handleUserLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
    } else if (typeof handleLogout === "function") {
      handleLogout();
    }
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={handleCloseMobileMenu}
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
                handleGroupSelect(groups[0]);
              } else {
                if (typeof setActiveTab === "function") {
                  setActiveTab("Overview");
                }
                handleCloseMobileMenu();
              }
            }}
          >
            <GraduationCap className={styles.logoIcon} size={22} />
            <span className={styles.collapseHideText}>StudyCollab</span>
          </div>

          <button
            className={styles.collapseToggleBtn}
            onClick={handleToggleCollapse}
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
                (m) => m.email?.toLowerCase() === resolvedEmail?.toLowerCase()
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
                  onClick={() => handleGroupSelect(group)}
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
                      onClick={(e) => {
                        if (typeof promptDeleteGroup === "function") {
                          promptDeleteGroup(e, group);
                        }
                      }}
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
            onClick={handleOpenNewGroup}
          >
            <Plus className={styles.btnIcon} size={18} />
            <span className={styles.collapseHideText}> New Group</span>
          </button>

          <button
            className={`${styles.newGroupBtn} ${styles.joinGroupBtn || ""}`}
            title="Join via Link"
            onClick={handleOpenJoinGroup}
          >
            <LinkIcon className={styles.btnIcon} size={18} />
            <span className={styles.collapseHideText}> Join Group</span>
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <div
            className={styles.footerAction}
            onClick={handleThemeToggle}
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

          <div
            className={styles.userInfo}
            title="Account Settings"
            onClick={() => {
              if (typeof setActiveTab === "function") {
                setActiveTab("Settings");
              }
              handleCloseMobileMenu();
            }}
          >
            <div className={styles.userAvatar}>
              {resolvedAvatarUrl && !avatarError ? (
                <img
                  src={resolvedAvatarUrl}
                  alt={resolvedDisplayName || "User Avatar"}
                  className={styles.userAvatarImg}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span>{resolvedInitials}</span>
              )}
            </div>
            <span
              className={`${styles.userEmailText} ${styles.collapseHideText}`}
            >
              {resolvedDisplayName}
            </span>
          </div>

          <div
            className={`${styles.footerAction} ${styles.logoutAction}`}
            onClick={handleUserLogout}
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