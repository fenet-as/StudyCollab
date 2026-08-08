import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  AlertTriangle, 
  Search, 
  Upload,
  ChevronLeft,
  PanelLeft
} from 'lucide-react';

import { useFiles } from '../hooks/useFiles';
import CategoryTree from '../components/CategoryTree';
import FileTable from '../components/FileTable';
import CategoryModal from '../components/Modals/CategoryModal';
import UploadModal from '../components/Modals/UploadModal';
import ConfirmDeleteModal from '../components/Modals/ConfirmDeleteModal';
import styles from './FilesPage.module.css';

export default function FilesPage({ group, isDarkMode = false }) {
  const groupId = group?.id;
  const { categories, files, loading, error, addCategory, removeCategory, uploadFile, removeFile, openFileInNewTab, downloadFile } = useFiles(groupId);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [activeFolderMenu, setActiveFolderMenu] = useState(null);
  const [activeFileMenu, setActiveFileMenu] = useState(null);

  // Horizontal/Vertical Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal State Controls
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [targetParentFolder, setTargetParentFolder] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [fileActionError, setFileActionError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveFolderMenu(null);
      setActiveFileMenu(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleAddCategory = async (name, parentId) => {
    try {
      await addCategory(name, parentId);
      if (parentId) setExpandedCategories(prev => ({ ...prev, [parentId]: true }));
      setIsCategoryModalOpen(false);
    } catch {
      setFileActionError('Failed to save category folder.');
    }
  };

  const handleUploadFile = async (file, categoryId) => {
    setIsUploading(true);
    try {
      await uploadFile(file, categoryId);
      setIsUploadModalOpen(false);
    } catch {
      setFileActionError('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'folder') await removeCategory(deleteTarget.id);
      else await removeFile(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setFileActionError(`Failed to delete ${deleteTarget.type}.`);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.uploader?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategoryId === null || f.categoryId === selectedCategoryId;
    return matchesSearch && matchesCat;
  });

  const isFiltered = searchQuery.trim().length > 0 || selectedCategoryId !== null;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId(null);
  };

  return (
    <div 
      className={`${styles.container} ${isDarkMode ? styles.darkMode : ''}`} 
      data-theme={isDarkMode ? 'dark' : 'light'}
    >
      {/* Collapsible Left Sidebar */}
      <section className={`${styles.leftSidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <h3>Categories</h3>
          <div className={styles.sidebarHeaderActions}>
            <button 
              type="button" 
              className={styles.addCategoryBtn} 
              onClick={() => { setTargetParentFolder(null); setIsCategoryModalOpen(true); }}
              title="Add Folder"
            >
              <FolderPlus size={16} /> Folder
            </button>
            <button
              type="button"
              className={styles.collapseSidebarBtn}
              onClick={() => setIsSidebarCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse categories"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
        
        {error && (
          <div className={styles.errorAlert}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {fileActionError && (
          <div className={styles.errorAlert}>
            <AlertTriangle size={16} /> {fileActionError}
          </div>
        )}

        <CategoryTree 
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          expandedCategories={expandedCategories}
          onToggleExpand={(id, e) => { e.stopPropagation(); setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] })); }}
          activeFolderMenu={activeFolderMenu}
          onToggleFolderMenu={(id, e) => { 
            e.stopPropagation(); 
            setActiveFileMenu(null);
            setActiveFolderMenu(activeFolderMenu === id ? null : id); 
          }}
          onOpenSubModal={(folder) => { setTargetParentFolder(folder); setIsCategoryModalOpen(true); setActiveFolderMenu(null); }}
          onTriggerFolderDelete={(cat) => setDeleteTarget({ type: 'folder', id: cat.id, name: cat.name, hasChildren: !!cat.children?.length })}
          isDarkMode={isDarkMode}
        />
      </section>

      {/* Main Explorer View */}
      <section className={styles.rightContent}>
        <header className={styles.explorerHeader}>
          <div className={styles.headerLeftGroup}>
            {isSidebarCollapsed && (
              <button
                type="button"
                className={styles.expandSidebarBtn}
                onClick={() => setIsSidebarCollapsed(false)}
                aria-label="Open categories sidebar"
                title="Open Categories"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search files or uploader..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className={styles.searchInput} 
              />
            </div>
          </div>

          <button type="button" className={styles.uploadBtn} onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={16} /> Upload File
          </button>
        </header>

        <FileTable 
          files={filteredFiles}
          isFiltered={isFiltered}
          activeFileMenu={activeFileMenu}
          onToggleFileMenu={(id, e) => {
            e.stopPropagation();
            setActiveFolderMenu(null);
            setActiveFileMenu(activeFileMenu === id ? null : id);
          }}
          onOpenFile={(id) => { openFileInNewTab(id); setActiveFileMenu(null); }} 
          onDownloadFile={(id, name) => { downloadFile(id, name); setActiveFileMenu(null); }} 
          onDeleteFile={(file) => { setDeleteTarget({ type: 'file', id: file.id, name: file.name }); setActiveFileMenu(null); }} 
          onUploadClick={() => setIsUploadModalOpen(true)}
          onClearFilters={handleClearFilters}
          isDarkMode={isDarkMode}
        />
      </section>

      {/* Integrated Modal Overlays */}
      <CategoryModal 
        isOpen={isCategoryModalOpen} 
        parentFolder={targetParentFolder} 
        onClose={() => setIsCategoryModalOpen(false)} 
        onSubmit={handleAddCategory} 
        loading={loading} 
        isDarkMode={isDarkMode}
      />
      
      <UploadModal 
        isOpen={isUploadModalOpen} 
        categories={categories} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUpload={handleUploadFile} 
        isUploading={isUploading} 
        isDarkMode={isDarkMode}
      />

      <ConfirmDeleteModal 
        target={deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={handleConfirmDelete} 
        loading={loading} 
        isDarkMode={isDarkMode}
      />
    </div>
  );
}