// src/features/files/components/FileTable.jsx
import React from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  File, 
  MoreVertical, 
  Eye, 
  Download, 
  Trash2 
} from 'lucide-react';
import NoFilesFound from './NoFilesFound';
import styles from './FileTable.module.css';

const formatBytes = (bytes, decimals = 2) => {
  const numBytes = Number(bytes);
  if (!numBytes || numBytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileTypeIcon = (type) => {
  const lowerType = type?.toLowerCase() || '';
  if (lowerType === 'pdf') return <FileText size={18} color="#e53e3e" />;
  if (lowerType === 'doc' || lowerType === 'docx') return <FileText size={18} color="#3182ce" />;
  if (lowerType === 'sheet' || lowerType === 'xls' || lowerType === 'xlsx' || lowerType === 'csv') {
    return <FileSpreadsheet size={18} color="#38a169" />;
  }
  if (lowerType === 'code' || lowerType === 'js' || lowerType === 'html' || lowerType === 'css') {
    return <FileCode size={18} color="#dd6b20" />;
  }
  return <File size={18} color="#718096" />;
};

export default function FileTable({ 
  files = [], 
  isFiltered = false, 
  activeFileMenu, 
  onToggleFileMenu, 
  onOpenFile, 
  onDownloadFile, 
  onDeleteFile,
  onUploadClick,
  onClearFilters 
}) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.filesTable}>
        <thead>
          <tr>
            <th>Name</th>
            <th className={styles.uploaderColumn}>Uploader</th>
            <th className={styles.dateColumn}>Date</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.length > 0 ? (
            files.map(file => (
              <tr 
                key={file.id} 
                className={styles.fileRow}
                onClick={() => onOpenFile(file.id)}
              >
                <td>
                  <div className={styles.fileNameCell}>
                    <span className={styles.fileIcon}>
                      {getFileTypeIcon(file.type)}
                    </span>
                    <div className={styles.fileNameAndInfo}>
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileSize}>
                        {typeof file.size === 'number' ? formatBytes(file.size) : file.size}
                      </span>
                    </div>
                  </div>
                </td>
                <td className={`${styles.uploaderText} ${styles.uploaderColumn}`}>
                  {file.uploader || 'Anonymous'}
                </td>
                <td className={`${styles.dateText} ${styles.dateColumn}`}>
                  {file.date || '-'}
                </td>
                <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.actionMenuWrapper}>
                    <button 
                      type="button"
                      className={styles.fileActionToggle}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFileMenu(file.id, e);
                      }}
                      title="File options"
                      aria-label="File options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeFileMenu === file.id && (
                      <div className={styles.actionDropdown}>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFile(file.id);
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadFile(file.id, file.name);
                          }}
                        >
                          <Download size={14} /> Download
                        </button>
                        <button 
                          type="button" 
                          className={styles.deleteOption} 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFile(file);
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">
                <NoFilesFound 
                  isFiltered={isFiltered} 
                  onUploadClick={onUploadClick}
                  onClearFilters={onClearFilters}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}