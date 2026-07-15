// frontend/src/features/dashboard/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

import NotesPage from '../../notes/pages/NotesPage';

import CreateGroupModal from '../../../components/interactive/CreateGroupModal/CreateGroupModal';
import DeleteConfirmModal from '../../../components/interactive/DeleteConfirmModal/DeleteConfirmModal';
import GroupOverview from '../components/GroupOverview';
import TasksPage from '../../tasks/pages/TasksPage';
import SettingsPane from '../components/SettingsPane'; // 👤 Imported user settings layout
import GroupSettingsPane from '../components/GroupSettingsPane'; // 👥 Imported group settings panel
import { groupApi } from '../../../api/groupApi';
import { userApi } from '../../../api/userApi'; // 👤 Imported userApi for profile sync

export default function Dashboard() {
  const navigate = useNavigate();
  
  // State
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedNote, setSelectedNote] = useState('Week 4 Lecture Notes');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // 👤 User State Configuration
  const [userProfile, setUserProfile] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userInitials, setUserInitials] = useState('U');
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  
  // Deletion Overlay State 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  const [noteContent, setNoteContent] = useState(
    "$$F = \\frac{d}{dt}(mv)$$\n\nThis formula represents the rate of change of momentum..."
  );

  // Sync profile details and pull workspaces on load
  useEffect(() => {
    // 1. Grab local storage cache as a fast first-paint fallback
    const cachedEmail = localStorage.getItem('email');
    if (cachedEmail) {
      setUserEmail(cachedEmail);
      setUserInitials(cachedEmail.charAt(0).toUpperCase());
    }

    // 2. Fetch both DB profile credentials and group spaces
    fetchUserProfile();
    fetchGroups();
  }, []);

  /**
   * Fetches authentic authenticated user details from the DB
   */
  const fetchUserProfile = async () => {
    try {
      const data = await userApi.getCurrentUser();
      setUserProfile(data);
      
      // Update local credentials state with fresh DB information
      if (data.email) setUserEmail(data.email);
      
      if (data.fullName) {
        // Build initials from Full Name (e.g., "Jane Doe" -> "JD", "Jane" -> "J")
        const nameParts = data.fullName.trim().split(/\s+/);
        if (nameParts.length > 1) {
          setUserInitials((nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase());
        } else if (nameParts[0]) {
          setUserInitials(nameParts[0][0].toUpperCase());
        }
      }
    } catch (err) {
      console.error("Could not fetch user info from DB, falling back to local cache:", err);
    }
  };

  /**
   * Syncs active dynamic records down from the backend
   */
  const fetchGroups = async (selectGroupId = null) => {
    try {
      setLoading(true);
      const data = await groupApi.getMyGroups();
      setGroups(data);
      
      if (data.length > 0) {
        if (selectGroupId) {
          const targetGroup = data.find(g => g.id === selectGroupId);
          setActiveGroup(targetGroup || data[0]);
        } else if (activeGroup) {
          const currentActive = data.find(g => g.id === activeGroup.id);
          setActiveGroup(currentActive || data[0]);
        } else {
          setActiveGroup(data[0]);
        }
      } else {
        setActiveGroup(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workspaces.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  };

  const handleCreateGroup = async (createdGroup) => {
    try {
      setIsNewGroupModalOpen(false);
      if (createdGroup && createdGroup.id) {
        await fetchGroups(createdGroup.id);
        setActiveTab('Overview');
      } else {
        await fetchGroups();
      }
    } catch (err) {
      console.error("Error refreshing dashboard state:", err);
    }
  };

  // Intercept list node dispatching to open safety modal
  const promptDeleteGroup = (e, group) => {
    e.stopPropagation(); 
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  // Submit confirmed deletion process
  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    
    try {
      await groupApi.deleteGroup(groupToDelete.id);
      
      if (activeGroup?.id === groupToDelete.id) {
        setActiveGroup(null);
      }
      
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      await fetchGroups();
    } catch (err) {
      console.error("Failed to delete group:", err);
      throw err;
    }
  };

  /**
   * Updates the active group's metadata instantly and refreshes the list in the sidebar.
   */
  const handleGroupUpdated = (updatedGroup) => {
    // 1. Instantly update active group state
    setActiveGroup(updatedGroup);
    
    // 2. Map through current groups list in state to update sidebar item instantly
    setGroups(prevGroups => 
      prevGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
  };

  // 👤 Determine the displayed profile handle (Full Name from DB preferred)
  const userDisplayName = userProfile?.fullName || (userEmail ? userEmail.split('@')[0] : 'User');

  return (
    <div className={styles.dashboardContainer} data-theme={isDarkMode ? 'dark' : 'light'}>
      
      {/* --- SIDEBAR CONTAINER --- */}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarTopRow}>
          <div 
            className={styles.sidebarLogo} 
            onClick={() => {
              if (groups.length > 0 && !activeGroup) {
                setActiveGroup(groups[0]);
              }
              setActiveTab('Overview');
            }} 
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.logoIcon}>🎓</span> 
            <span className={styles.collapseHideText}>StudyCollab</span>
          </div>
          <button 
            className={styles.collapseToggleBtn} 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? '👉' : '👈'}
          </button>
        </div>
        
        <div className={styles.sectionLabel}>
          <span className={styles.collapseHideText}>Study Groups</span>
        </div>
        
        {loading && groups.length === 0 ? (
          <p className={styles.collapseHideText} style={{ padding: '0 1rem', fontSize: '0.85rem', color: '#888' }}>
            Loading workspaces...
          </p>
        ) : error ? (
          <p className={styles.collapseHideText} style={{ padding: '0 1rem', fontSize: '0.85rem', color: '#ef4444' }}>
            Error loading groups.
          </p>
        ) : (
          <ul className={styles.groupList}>
            {groups.map((group, index) => {
              const fallbackEmojis = ['📘', '📙', '📗', '📓', '📕'];
              const emoji = fallbackEmojis[index % fallbackEmojis.length];

              const currentMember = group.members?.find(
                m => m.email?.toLowerCase() === userEmail?.toLowerCase()
              );

              const roleStr = currentMember?.role ? currentMember.role.toString().toUpperCase() : '';
              const hasManagementRights = roleStr === 'ADMIN' || roleStr === 'CREATOR' || roleStr === 'OWNER';
              const showDelete = hasManagementRights && !isSidebarCollapsed;

              return (
                <li 
                  key={group.id}
                  className={`${activeGroup?.id === group.id && activeTab !== 'Settings' ? styles.activeGroupItem : styles.groupItem} ${styles.groupItemWithDelete}`} 
                  onClick={() => {
                    setActiveGroup(group);
                    setActiveTab('Overview'); // 👈 Direct route back to dashboard overview metrics
                  }}
                  title={group.name}
                >
                  <div className={styles.groupMainInfo}>
                    {group.avatarUrl ? (
                      <img 
                        src={`http://localhost:8080${group.avatarUrl}`} 
                        alt="avatar" 
                        className={styles.groupAvatarImg} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className={styles.groupIcon}>{emoji}</span>
                    )}
                    <span className={styles.collapseHideText}>{group.name}</span>
                  </div>

                  {/* Inline Delete Anchor Node */}
                  {showDelete && (
                    <button 
                      className={styles.deleteSidebarGroupBtn}
                      onClick={(e) => promptDeleteGroup(e, group)}
                      title="Delete Group"
                    >
                      🗑️
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <button 
          className={styles.newGroupBtn} 
          title="New Group"
          onClick={() => setIsNewGroupModalOpen(true)}
        >
          <span className={styles.btnIcon}>+</span>
          <span className={styles.collapseHideText}> New Group</span>
        </button>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerAction} onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Theme">
            <span className={styles.footerIcon}>{isDarkMode ? '☀️' : '🌙'}</span> 
            <span className={styles.collapseHideText}>{isDarkMode ? ' Light Mode' : ' Dark Mode'}</span>
          </div>

          {/* 👤 Routes to the Settings screen when clicked */}
          <div 
            className={styles.userInfo} 
            title="Account Settings" 
            onClick={() => setActiveTab('Settings')}
            style={{ cursor: 'pointer' }}
          >
            {/* Displaying dynamic initials */}
            <div className={styles.userAvatar}>{userInitials}</div>
            {/* Displaying full name from DB if available, falling back to clean email string */}
            <span className={`${styles.userEmailText} ${styles.collapseHideText}`}>
              {userDisplayName}
            </span>
          </div>
          
          <div className={styles.footerAction} onClick={handleLogout} style={{ color: '#ef4444', fontWeight: '600' }} title="Logout">
            <span className={styles.footerIcon}>🚪</span> 
            <span className={styles.collapseHideText}> Logout</span>
          </div>
        </div>
      </aside>

      {/* --- MAIN INTERIOR PLATFORM --- */}
      <main className={styles.contentArea}>
        {activeTab === 'Settings' ? (
          /* 👤 ISOLATED SETTINGS ROUTE */
          <SettingsPane onProfileUpdated={fetchUserProfile} />
        ) : activeGroup ? (
          /* 👥 WORKSPACE CORE INTERACTION INTERFACE */
          <>
            <header className={styles.contentHeader}>
              <div className={styles.headerLeft}>
                <h2>{activeGroup.name}</h2>
              </div>
              <div className={styles.headerRight}>
                <div className={styles.avatarGroup}>
                  {activeGroup.members?.slice(0, 4).map((member) => (
                    <div 
                      key={member.id} 
                      className={styles.stackedAvatar} 
                      title={`${member.fullName} (${member.role})`}
                    >
                      {member.fullName ? member.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                  ))}
                  {activeGroup.members?.length > 4 && (
                    <div className={styles.stackedAvatar} style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', color: '#475569' }}>
                      +{activeGroup.members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </header>

            <nav className={styles.tabsNav}>
              {/* Added Group Settings to the dynamic array map */}
              {['Overview', 'Notes', 'Tasks', 'Files', 'Chat', 'Group Settings'].map((tab) => (
                <span 
                  key={tab}
                  className={`${styles.tabLink} ${activeTab === tab ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </span>
              ))}
            </nav>

            <div className={styles.viewPortWrapper}>
              {activeTab === 'Overview' && <GroupOverview setActiveTab={setActiveTab} group={activeGroup} />}
              {activeTab === 'Tasks' && <TasksPage group={activeGroup} />}
              
              {/* 👥 Dynamic Group settings tab initialization */}
              {activeTab === 'Group Settings' && (
                <GroupSettingsPane 
                  group={activeGroup} 
                  onGroupUpdated={handleGroupUpdated} 
                />
              )}

              
                

{activeTab === 'Notes' && (
  <NotesPage group={activeGroup} />
)}
           
              {(activeTab === 'Files' || activeTab === 'Chat') && (
                <div className={styles.placeholderTabContent}>
                  <div className={styles.emptyIllustration}>💬</div>
                  <h3>{activeTab} Feature Space</h3>
                  <p>Coming soon to the StudyCollab workspace.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* FALLBACK GRAPHICS INTERFACE */
          <div className={styles.placeholderTabContent} style={{ height: '80%' }}>
            <div className={styles.emptyIllustration}>👥</div>
            <h3>No Workspaces Yet</h3>
            <p>Create a new study group using the sidebar button to get started!</p>
          </div>
        )}
      </main>

      {/* --- FLOATING OVERLAY MODALS --- */}
      {isNewGroupModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsNewGroupModalOpen(false)} 
          onSubmit={handleCreateGroup} 
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