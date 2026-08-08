// frontend/src/features/files/hooks/useFiles.js

import { useState, useEffect, useCallback } from 'react';
import { filesApi } from '../../../api/filesApi';

export function useFiles(groupId) {
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const [catsData, filesData] = await Promise.all([
        filesApi.getCategories(groupId),
        filesApi.getFiles(groupId)
      ]);
      setCategories(catsData);
      setFiles(filesData);
    } catch (err) {
      setError(err.message || 'Something went wrong fetching group files.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const addCategory = async (name, parentId = null) => {
    if (!groupId) return;
    try {
      const newCat = await filesApi.createCategory(groupId, { name, parentId });
      await fetchAllData();
      return newCat;
    } catch (err) {
      setError(err.message || 'Failed to create folder');
      throw err;
    }
  };

  const removeCategory = async (categoryId) => {
    if (!groupId) return;
    try {
      await filesApi.deleteCategory(groupId, categoryId);
      await fetchAllData();
    } catch (err) {
      setError(err.message || 'Failed to delete folder');
      throw err;
    }
  };

  const uploadFile = async (fileObj, categoryId) => {
    if (!groupId) return;
    try {
      const formData = new FormData();
      formData.append('file', fileObj);
      
      if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
        formData.append('categoryId', categoryId.toString());
      } else {
        throw new Error('A specific category selection is required to upload files.');
      }

      const uploadedFile = await filesApi.uploadFile(groupId, formData);
      await fetchAllData();
      return uploadedFile;
    } catch (err) {
      setError(err.message || 'Failed to upload file');
      throw err;
    }
  };

  const removeFile = async (fileId) => {
    if (!groupId) return;
    try {
      await filesApi.deleteFile(groupId, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setError(err.message || 'Failed to delete file');
      throw err;
    }
  };

  // Helper 1: Forces a local file download directly from Cloudflare R2
  const downloadFile = async (fileId) => {
    if (!groupId || !fileId) return;
    try {
      const { downloadUrl } = await filesApi.getFileDownloadUrl(groupId, fileId, 'attachment');
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download file.');
    }
  };

  // Helper 2: Opens file directly in a new tab for browser rendering (PDFs, images, etc.)
  const openFileInNewTab = async (fileId) => {
  if (!groupId || !fileId) return;
  try {
    // 1. Fetch presigned URL using authenticated fetch (includes JWT)
    const { downloadUrl } = await filesApi.getFileDownloadUrl(groupId, fileId, 'inline');
    
    // 2. Open the Cloudflare R2 presigned URL in a new tab (no auth header needed for R2)
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('Open file failed:', err);
    setError('Failed to open file preview.');
  }
};

  return {
    categories,
    files,
    loading,
    error,
    addCategory,
    removeCategory,
    uploadFile,
    removeFile,
    downloadFile,
    openFileInNewTab,
    refetch: fetchAllData
  };
}