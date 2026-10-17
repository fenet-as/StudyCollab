import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";


import { ShieldAlert, Loader2 } from "lucide-react";

import FilesPage from "../../files/pages/FilesPage";
import NotesPage from "../../notes/pages/NotesPage";
import TasksPage from "../../tasks/pages/TasksPage";
import ChatPage from "../../chat/pages/ChatPage";

import EmptyState from "../../../components/common/EmptyState/EmptyState";
import CreateGroupModal from "../../../components/interactive/CreateGroupModal/CreateGroupModal";
import JoinGroupModal from "../../../components/interactive/JoinGroupModal/JoinGroupModal";
import DeleteConfirmModal from "../../../components/interactive/DeleteConfirmModal/DeleteConfirmModal";
import GroupOverview from "../components/GroupOverview/GroupOverview";
import SettingsPane from "../components/settings/SettingsPane";
import GroupSettingsPane from "../components/GroupSettings/GroupSettingsPane";
import AdminPanel from "../components/GroupSettings/GroupAdminPane";

import MobileHeader from "../components/MobileHeader/MobileHeader";
import Sidebar from "../components/Sidebar/Sidebar";
import ContentHeader from "../components/ContentHeader/ContentHeader";
import TabNavigation from "../components/TabNavigation/TabNavigation";

import { groupApi } from "../../../api/groupApi";
import { userApi } from "../../../api/userApi";

import { useTheme } from "../../../context/useTheme";
import { useAuthContext } from "../../../context/useAuthContext";
import { useGroupsContext } from "../../../context/useGroupsContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuthContext();
  const {
    groups,
    activeGroup,
    setActiveGroup,
    loading: groupsLoading,
    error: groupsError,
    fetchGroups,
    deleteGroup,
    updateGroup,
    leaveGroup,
  } = useGroupsContext();

  // Permission State from Backend
  const [permissions, setPermissions] = useState({
    role: null,
    isAdmin: false,
    isCreator: false,
    isOwnerOrAdmin: false,
  });
  const [checkingPermissions, setCheckingPermissions] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User State
  const [userProfile, setUserProfile] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("U");

  // Modal State
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  useEffect(() => {
    const cachedEmail = localStorage.getItem("email");
    if (cachedEmail) {
      setUserEmail(cachedEmail);
      setUserInitials(cachedEmail.charAt(0).toUpperCase());
    }

    fetchUserProfile();
  }, []);

  const fetchPermissions = async (groupId) => {
    if (!groupId) return null;
    setCheckingPermissions(true);
    try {
      const permissionData = await groupApi.getGroupPermissions(groupId);
      const updatedPerms = {
        role: permissionData.role || null,
        isAdmin: permissionData.isAdmin ?? permissionData.admin ?? false,
        isCreator: permissionData.isCreator ?? permissionData.creator ?? false,
        isOwnerOrAdmin:
          permissionData.isOwnerOrAdmin ?? permissionData.ownerOrAdmin ?? false,
      };
      setPermissions(updatedPerms);
      return updatedPerms;
    } catch (err) {
      console.error("Could not fetch user permissions for group:", err);
      const fallback = {
        role: null,
        isAdmin: false,
        isCreator: false,
        isOwnerOrAdmin: false,
      };
      setPermissions(fallback);
      return fallback;
    } finally {
      setCheckingPermissions(false);
    }
  };

  useEffect(() => {
    if (activeGroup?.id) {
      fetchPermissions(activeGroup.id);
    } else {
      setPermissions({
        role: null,
        isAdmin: false,
        isCreator: false,
        isOwnerOrAdmin: false,
      });
    }
  }, [activeGroup?.id]);

  const fetchUserProfile = async () => {
    try {
      const data = await userApi.getCurrentUser();
      setUserProfile(data);

      if (data.email) setUserEmail(data.email);

      if (data.fullName) {
        const nameParts = data.fullName.trim().split(/\s+/);
        if (nameParts.length > 1) {
          setUserInitials(
            (
              nameParts[0][0] + nameParts[nameParts.length - 1][0]
            ).toUpperCase(),
          );
        } else if (nameParts[0]) {
          setUserInitials(nameParts[0][0].toUpperCase());
        }
      }
    } catch (err) {
      console.error(
        "Could not fetch user info from DB, falling back to local cache:",
        err,
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn("Logout error:", err);
    }
    navigate("/login");
  };

  const handleCreateGroup = () => {
    setIsNewGroupModalOpen(false);
    setActiveTab("Overview");
  };

  const handleJoinGroup = async (joinedGroup) => {
    try {
      setIsJoinModalOpen(false);
      if (joinedGroup?.id) {
        await fetchGroups(joinedGroup.id);
      } else {
        await fetchGroups();
      }
      setActiveTab("Overview");
    } catch (err) {
      console.error("Error updating group list after joining:", err);
    }
  };

  const handleLeaveGroupSuccess = (leftGroupId) => {
    leaveGroup(leftGroupId);
    setActiveTab("Overview");
  };

  const promptDeleteGroup = (e, group) => {
    e.stopPropagation();
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    const deletedId = groupToDelete.id;

    try {
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      await deleteGroup(deletedId);
    } catch (err) {
      console.error("Failed to delete group:", err);
      await fetchGroups();
      throw err;
    }
  };

  // Synchronizes profile and fresh member lists across all headers
  const handleGroupUpdated = (updatedGroup) => {
    if (updatedGroup) {
      updateGroup(updatedGroup);
    }
  };

  const handleNavigateToAdmin = async () => {
    if (activeGroup?.id) {
      await fetchPermissions(activeGroup.id);
    }
    setActiveTab("Admin Panel");
  };

  const userDisplayName =
    userProfile?.fullName || (userEmail ? userEmail.split("@")[0] : "User");

  return (
    <div className={styles.dashboardContainer}>
      <MobileHeader
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setActiveTab={setActiveTab}
        userInitials={userInitials}
        userAvatarUrl={userProfile?.avatarUrl}
      />

      <Sidebar
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={setActiveGroup}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        loading={groupsLoading}
        error={groupsError}
        currentUser={{
          email: userEmail,
          displayName: userDisplayName,
          initials: userInitials,
          avatarUrl: userProfile?.avatarUrl,
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isDarkMode={isDark}
        onToggleTheme={toggleTheme}
        onNewGroup={() => {
          setIsNewGroupModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
        onJoinGroup={() => {
          setIsJoinModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
        onDeleteGroup={promptDeleteGroup}
        onLogout={handleLogout}
      />

      <main className={styles.contentArea}>
        {activeTab === "Settings" ? (
          <SettingsPane
            onProfileUpdated={async (updatedProfile) => {
              if (updatedProfile?.avatarUrl) {
                setUserProfile((prev) =>
                  prev
                    ? { ...prev, avatarUrl: updatedProfile.avatarUrl }
                    : { avatarUrl: updatedProfile.avatarUrl }
                );
              }
              if (updatedProfile?.fullName) {
                setUserProfile((prev) =>
                  prev
                    ? { ...prev, fullName: updatedProfile.fullName }
                    : { fullName: updatedProfile.fullName }
                );
              }
              await fetchUserProfile();
              if (activeGroup?.id) {
                await fetchGroups(activeGroup.id);
              }
            }}
          />




        ) : activeGroup ? (
          <>
            <ContentHeader
              activeGroup={activeGroup}
              setActiveTab={setActiveTab}
            />

            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className={styles.viewPortWrapper}>
              {activeTab === "Overview" && (
                <GroupOverview
                  groupId={activeGroup.id}
                  group={activeGroup}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === "Tasks" && <TasksPage group={activeGroup} />}

              {activeTab === "Group Settings" && (
                <GroupSettingsPane
                  group={activeGroup}
                  currentUser={userProfile}
                  onGroupUpdated={handleGroupUpdated}
                  onNavigateToAdmin={handleNavigateToAdmin}
                  onLeaveSuccess={handleLeaveGroupSuccess}
                />
              )}

              {activeTab === "Admin Panel" &&
                (checkingPermissions ? (
                  <div className={styles.placeholderTabContent}>
                    <Loader2
                      size={40}
                      className="animate-spin"
                      color="#6366f1"
                    />
                    <p style={{ marginTop: "1rem" }}>Checking permissions...</p>
                  </div>
                ) : permissions.isOwnerOrAdmin ? (
                  <AdminPanel
                    group={activeGroup}
                    currentUser={userProfile}
                    onGroupUpdated={handleGroupUpdated}
                    onBack={() => setActiveTab("Group Settings")}
                  />
                ) : (
                  <div className={styles.placeholderTabContent}>
                    <div className={styles.emptyIllustration}>
                      <ShieldAlert
                        size={56}
                        strokeWidth={1.5}
                        color="#ef4444"
                      />
                    </div>
                    <h3>Access Restricted</h3>
                    <p>
                      Only group administrators and owners can view the Admin
                      Panel.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginTop: "1rem" }}
                      onClick={() => setActiveTab("Group Settings")}
                    >
                      Return to Settings
                    </button>
                  </div>
                ))}

              {activeTab === "Notes" && (
                <NotesPage group={activeGroup} isDarkMode={isDark} />
              )}

              {activeTab === "Files" && (
                <FilesPage group={activeGroup} isDarkMode={isDark} />
              )}

              {activeTab === "Chat" && (
                <div className={styles.placeholderTabContent}>
                  <ChatPage />
                </div>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            onCreateGroup={() => setIsNewGroupModalOpen(true)}
            onJoinGroup={() => setIsJoinModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      {isNewGroupModalOpen && (
        <CreateGroupModal
          onClose={() => setIsNewGroupModalOpen(false)}
          onSubmit={handleCreateGroup}
        />
      )}

      {isJoinModalOpen && (
        <JoinGroupModal
          onClose={() => setIsJoinModalOpen(false)}
          onJoinSuccess={handleJoinGroup}
        />
      )}

      {isDeleteModalOpen && groupToDelete && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          groupName={groupToDelete.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setGroupToDelete(null);
          }}
        />
      )}
    </div>
  );
}
