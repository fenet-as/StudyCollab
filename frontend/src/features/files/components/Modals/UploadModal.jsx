// src/features/files/components/Modals/UploadModal.jsx
import React, { useState, useRef } from 'react';
import { FolderOpen, FileText } from 'lucide-react';
import styles from './Modals.module.css';

export default function UploadModal({ isOpen, categories, onClose, onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const getFlatCategoriesList = (catList, depth = 0) => {
    let flat = [];
    catList.forEach(cat => {
      flat.push({ id: cat.id, name: `${'— '.repeat(depth)}${cat.name}` });
      if (cat.children && cat.children.length > 0) {
        flat = flat.concat(getFlatCategoriesList(cat.children, depth + 1));
      }
    });
    return flat;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadCategory) return;
    onUpload(selectedFile, parseInt(uploadCategory, 10));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Upload File from Device</h3>
        <p className={styles.modalDescription}>Select a resource file from your local system storage.</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Choose File</label>
            <div className={styles.filePickerContainer}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
              />
              <button 
                type="button" 
                className={styles.browseBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <FolderOpen size={16} /> Browse Files...
              </button>
              {selectedFile && (
                <div className={styles.selectedFileFeedback}>
                  <FileText size={16} />
                  <span>{selectedFile.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Destination Category <span style={{ color: 'red' }}>*</span></label>
            <select 
              value={uploadCategory} 
              onChange={(e) => setUploadCategory(e.target.value)}
              required
              disabled={isUploading}
            >
              <option value="" disabled>-- Select Category Folder --</option>
              {getFlatCategoriesList(categories).map(item => (
                <option key={item.id} value={item.id.toString()}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.modalActions}>
            <button type="button" disabled={isUploading} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.modalSubmitBtn} disabled={!selectedFile || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}