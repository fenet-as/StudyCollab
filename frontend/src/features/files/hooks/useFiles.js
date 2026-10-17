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
      setError(err.response?.data?.message || err.message || 'Something went wrong fetching group files.');
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
      const msg = err.response?.data?.message || err.message || 'Failed to create folder';
      setError(msg);
      throw new Error(msg);
    }
  };

  const removeCategory = async (categoryId) => {
    if (!groupId) return;
    try {
      await filesApi.deleteCategory(groupId, categoryId);
      await fetchAllData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete folder';
      setError(msg);
      throw new Error(msg);
    }
  };

  const uploadFile = async (fileObj, categoryId) => {
    if (!groupId) return;
    try {
      if (categoryId === undefined || categoryId === null || categoryId === '') {
        throw new Error('A specific category selection is required to upload files.');
      }

      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('categoryId', Number(categoryId));

      const uploadedFile = await filesApi.uploadFile(groupId, formData);
      await fetchAllData();
      return uploadedFile;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload file';
      setError(msg);
      throw new Error(msg);
    }
  };

  const removeFile = async (fileId) => {
    if (!groupId) return;
    try {
      await filesApi.deleteFile(groupId, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete file';
      setError(msg);
      throw new Error(msg);
    }
  };

  const downloadFile = async (fileId) => {
    if (!groupId || !fileId) return;
    try {
      const res = await filesApi.getFileDownloadUrl(groupId, fileId, 'attachment');
      const url = res.url || res.downloadUrl;
      
      const link = document.createElement('a');
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download file.');
    }
  };

  const openFileInNewTab = async (fileId) => {
    if (!groupId || !fileId) return;
    try {
      const res = await filesApi.getFileDownloadUrl(groupId, fileId, 'inline');
      const url = res.url || res.downloadUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
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