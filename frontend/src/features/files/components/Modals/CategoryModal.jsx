// src/features/files/components/Modals/CategoryModal.jsx
import React, { useState } from 'react';
import styles from './Modals.module.css';

export default function CategoryModal({ isOpen, parentFolder, onClose, onSubmit, loading }) {
  const [categoryName, setCategoryName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    onSubmit(categoryName, parentFolder ? parentFolder.id : null);
    setCategoryName('');
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>{parentFolder ? 'Create Subfolder' : 'Add New Category'}</h3>
        <p className={styles.modalDescription}>
          {parentFolder ? `Creating subfolder inside "${parentFolder.name}"` : 'This will add a brand new top-level category folder.'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Category Name</label>
            <input 
              type="text" 
              value={categoryName} 
              onChange={(e) => setCategoryName(e.target.value)} 
              placeholder={parentFolder ? 'e.g. Final Review Sheets' : 'e.g. Past Exams'}
              required
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={loading}>
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}