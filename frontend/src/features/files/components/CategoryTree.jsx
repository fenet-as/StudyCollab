// src/features/files/components/CategoryTree.jsx
import React from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  MoreVertical, 
  FolderPlus, 
  Trash2,
  Files
} from 'lucide-react';

import styles from './CategoryTree.module.css'; // <-- Imports own CSS module

export default function CategoryTree({
  categories,
  selectedCategoryId,
  onSelectCategory,
  expandedCategories,
  onToggleExpand,
  activeFolderMenu,
  onToggleFolderMenu,
  onOpenSubModal,
  onTriggerFolderDelete
}) {
  const renderCategoryNode = (category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = !!expandedCategories[category.id];
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} style={{ marginLeft: `${depth * 8}px` }}>
        <div 
          role="button"
          tabIndex={0}
          aria-selected={isSelected}
          aria-label={`Category ${category.name}`}
          className={`${styles.categoryItem} ${isSelected ? styles.categorySelected : ''}`}
          onClick={() => onSelectCategory(category.id)}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelectCategory(category.id);
            }
          }}
        >
          <div className={styles.categoryLeft}>
            {hasChildren ? (
              <button 
                type="button"
                className={styles.expandArrow} 
                onClick={(e) => onToggleExpand(category.id, e)}
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className={styles.bulletPlaceholder} style={{ display: 'inline-block', width: 14 }} />
            )}
            <span className={styles.folderIcon}>
              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
            </span>
            <span className={styles.categoryLabelText}>{category.name}</span>
          </div>

          <div className={styles.actionMenuWrapper}>
            <button 
              type="button"
              className={styles.folderActionToggle}
              onClick={(e) => onToggleFolderMenu(category.id, e)}
              aria-label="Folder options"
            >
              <MoreVertical size={16} />
            </button>
            {activeFolderMenu === category.id && (
              <div className={styles.actionDropdown}>
                <button type="button" onClick={(e) => {
                  e.stopPropagation();
                  onOpenSubModal(category);
                }}>
                  <FolderPlus size={14} /> Add Subfolder
                </button>
                <button type="button" className={styles.deleteOption} onClick={(e) => {
                  e.stopPropagation();
                  onTriggerFolderDelete(category);
                }}>
                  <Trash2 size={14} /> Delete Folder
                </button>
              </div>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className={styles.categoryChildrenContainer}>
            {category.children.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.categoryTree}>
      <button 
        type="button"
        className={`${styles.categoryItem} ${selectedCategoryId === null ? styles.categorySelected : ''}`}
        onClick={() => onSelectCategory(null)}
        aria-label="All Files"
      >
        <span className={styles.folderIcon}>
          <Files size={16} />
        </span>
        <strong className={styles.categoryLabelText}>All Files</strong>
      </button>
      {categories.map(cat => renderCategoryNode(cat))}
    </div>
  );
}