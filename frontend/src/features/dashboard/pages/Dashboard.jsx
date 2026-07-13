import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState('Physics 101');
  const [activeTab, setActiveTab] = useState('Notes');
  const [selectedNote, setSelectedNote] = useState('Week 4 Lecture Notes');
  
  // Dynamic User State pulled from registration/login cached items
  const [userEmail, setUserEmail] = useState('');
  const [userInitials, setUserInitials] = useState('U');

  useEffect(() => {
    const cachedEmail = localStorage.getItem('email');
    if (cachedEmail) {
      setUserEmail(cachedEmail);
      // Extract initials from email username as an avatar placeholder string
      const initial = cachedEmail.charAt(0).toUpperCase();
      setUserInitials(initial);
    }
  }, []);

  // Clear tracking tokens to log out safely
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  };
  
  // Note editing state instance matching mockup text
  const [noteContent, setNoteContent] = useState(
    "$$F = \\frac{d}{dt}(mv)$$\n\nThis formula represents the rate of change of momentum..."
  );

  return (
    <div className={styles.dashboardContainer}>
      
      {/* --- SIDEBAR --- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className={styles.logoIcon}>🎓</span> StudyCollab
        </div>
        
        <div className={styles.sectionLabel}>My Groups</div>
        <ul className={styles.groupList}>
          <li 
            className={activeGroup === 'Physics 101' ? styles.activeGroupItem : ''} 
            onClick={() => setActiveGroup('Physics 101')}
          >
            👥 Physics 101
          </li>
          <li 
            className={activeGroup === 'Thesis Team' ? styles.activeGroupItem : ''} 
            onClick={() => setActiveGroup('Thesis Team')}
          >
            👥 Thesis Team
          </li>
        </ul>
        
        <button className={styles.newGroupBtn}>+ New Group</button>
        
        {/* User Footplate */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo} title={userEmail}>
            <div className={styles.userAvatar}>{userInitials}</div>
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '110px' }}>
              {userEmail ? userEmail.split('@')[0] : 'User'}
            </span>
          </div>
          <div className={styles.footerAction}>⚙️ Settings</div>
          <div className={styles.footerAction} onClick={handleLogout} style={{ color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}>
            🚪 Logout
          </div>
        </div>
      </aside>

      {/* --- MAIN INTERIOR PLATFORM --- */}
      <main className={styles.contentArea}>
        
        {/* Top Header Controls */}
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.breadcrumbContext}>Header</span>
            <h2>{activeGroup}</h2>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.avatarGroup}>
              <div className={styles.stackedAvatar}>👩‍💻</div>
              <div className={styles.stackedAvatar}>👨‍💻</div>
              <div className={styles.stackedAvatar}>🧑‍💻</div>
            </div>
            <button className={styles.manageGroupBtn}>⚙️ Manage Group ▾</button>
          </div>
        </header>

        {/* Feature Tab Selector */}
        <nav className={styles.tabsNav}>
          {['Notes', 'Tasks', 'Files', 'Chat (Placeholder)'].map((tab) => (
            <span 
              key={tab}
              className={`${styles.tabLink} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </span>
          ))}
        </nav>

        {/* --- DYNAMIC SPLIT VIEW: NOTES APP VIEW --- */}
        {activeTab === 'Notes' && (
          <div className={styles.notesWorkspace}>
            
            {/* Note Files Sub-list */}
            <div className={styles.notesSidebar}>
              <div className={styles.notesSidebarHeader}>Notes Tab</div>
              
              <div 
                className={`${styles.noteListItem} ${selectedNote === 'Week 4 Lecture Notes' ? styles.activeNoteItem : ''}`}
                onClick={() => setSelectedNote('Week 4 Lecture Notes')}
              >
                <h4>Week 4 Lecture Notes</h4>
                <span>Last Edited: 2023-10-27</span>
              </div>

              <div 
                className={`${styles.noteListItem} ${selectedNote === 'Optics Formulae' ? styles.activeNoteItem : ''}`}
                onClick={() => setSelectedNote('Optics Formulae')}
              >
                <h4>Optics Formulae</h4>
                <span>Last Edited: 2023-10-27</span>
              </div>

              <div 
                className={`${styles.noteListItem} ${selectedNote === 'Thermodynamics HW' ? styles.activeNoteItem : ''}`}
                onClick={() => setSelectedNote('Thermodynamics HW')}
              >
                <h4>Thermodynamics HW</h4>
                <span>Last Edited: 2023-10-27</span>
              </div>
            </div>

            {/* Live Editor Pane */}
            <div className={styles.editorPane}>
              <div className={styles.editorToolbar}>
                <span><b>B</b></span>
                <span><i>I</i></span>
                <span>H1</span>
                <span>H2</span>
                <span>LaTeX</span>
                <span><b>$$</b></span>
              </div>
              
              <div className={styles.editorContentContainer}>
                <h3 className={styles.editorNoteTitle}># Week 4: Mechanics</h3>
                <textarea 
                  className={styles.rawMarkdownTextarea}
                  value={noteContent} 
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>

              <div className={styles.editorActionsFooter}>
                <button className={styles.saveNoteBtn}>Save</button>
                <button className={styles.deleteNoteBtn}>Delete</button>
              </div>
            </div>

          </div>
        )}

        {activeTab !== 'Notes' && (
          <div className={styles.placeholderTabContent}>
            <h3>{activeTab} Content View</h3>
            <p>Modular component logic points to features directory modules.</p>
          </div>
        )}

      </main>
    </div>
  );
}