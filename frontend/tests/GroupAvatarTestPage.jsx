import React, { useState, useEffect, useCallback } from 'react';
import styles from './GroupAvatarTestPage.module.css';

const API_BASE_URL = 'http://localhost:8080';

export default function GroupAvatarTestPage() {
  const [groupId, setGroupId] = useState('1');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingGroup, setFetchingGroup] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Helper to format URL and bypass browser cache
  const formatAvatarUrl = (url) => {
    if (!url) return '';
    const timestamp = `t=${Date.now()}`;
    return url.includes('?') ? `${url}&${timestamp}` : `${url}?${timestamp}`;
  };

  // 1. Fetch current group avatar from backend
  const fetchGroupAvatar = useCallback(async (targetGroupId) => {
    if (!targetGroupId) return;

    setFetchingGroup(true);
    setImageError(false);
    setStatusMessage(null);

    const token = localStorage.getItem('token') || localStorage.getItem('jwt');

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${targetGroupId}/avatar`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.status === 404) {
        setUploadedUrl('');
        setStatusMessage({ type: 'error', text: `Group with ID ${targetGroupId} not found.` });
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load group avatar. HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.avatarUrl) {
        setUploadedUrl(formatAvatarUrl(data.avatarUrl));
      } else {
        setUploadedUrl('');
      }
    } catch (err) {
      console.error('Failed to fetch group avatar:', err);
      setStatusMessage({ type: 'error', text: err.message });
      setUploadedUrl('');
    } finally {
      setFetchingGroup(false);
    }
  }, []);

  // Fetch avatar whenever user changes the Group ID
  useEffect(() => {
    if (groupId) {
      fetchGroupAvatar(groupId);
    }
  }, [groupId, fetchGroupAvatar]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select an image file (JPG, PNG, WEBP).' });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatusMessage(null);
  };

  // 2. Upload Group Avatar to Cloudflare R2
  const handleUpload = async () => {
    if (!selectedFile || !groupId) return;

    setLoading(true);
    setStatusMessage(null);
    setImageError(false);

    const formData = new FormData();
    formData.append('file', selectedFile); // Matches @RequestParam("file")

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt');

      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/avatar`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Upload failed with status ${response.status}`);
      }

      const formatted = formatAvatarUrl(data.avatarUrl);
      setUploadedUrl(formatted);
      setSelectedFile(null);
      setPreviewUrl(null);
      setStatusMessage({ type: 'success', text: `Group ${groupId} avatar updated successfully!` });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Group Avatar
  const handleDelete = async () => {
    if (!groupId || !window.confirm(`Delete avatar for Group ${groupId}?`)) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt');

      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/avatar`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete avatar. Status ${response.status}`);
      }

      setUploadedUrl('');
      setStatusMessage({ type: 'success', text: `Avatar for Group ${groupId} deleted.` });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Group Avatar R2 Test Page</h2>
      <p className={styles.subtitle}>Test local image selection and Cloudflare R2 upload for group avatars.</p>

      {/* Target Group Selector */}
      <div className={styles.groupIdBar}>
        <label htmlFor="groupIdInput">Target Group ID:</label>
        <input
          id="groupIdInput"
          type="number"
          min="1"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className={styles.groupInput}
        />
        <button
          className={styles.fetchBtn}
          onClick={() => fetchGroupAvatar(groupId)}
          disabled={fetchingGroup || !groupId}
        >
          {fetchingGroup ? 'Loading...' : 'Fetch Avatar'}
        </button>
      </div>

      {statusMessage && (
        <div className={`${styles.alert} ${styles[statusMessage.type]}`}>
          {statusMessage.text}
        </div>
      )}

      <div className={styles.cardGrid}>
        {/* Step 1: File Picker */}
        <div className={styles.card}>
          <h3>1. Select New Group Avatar</h3>

          <div className={styles.previewBox}>
            {previewUrl ? (
              <img src={previewUrl} alt="Selected Local Preview" className={styles.avatarImg} />
            ) : (
              <div className={styles.placeholder}>No new image selected</div>
            )}
          </div>

          <label className={styles.fileLabel}>
            Choose File
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
          </label>

          <button
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={!selectedFile || loading || !groupId}
          >
            {loading ? 'Uploading to R2...' : `Upload to Group ${groupId}`}
          </button>
        </div>

        {/* Step 2: Backend Saved Image */}
        <div className={styles.card}>
          <h3>2. Current Saved Avatar (Backend)</h3>

          <div className={styles.previewBox}>
            {fetchingGroup ? (
              <div className={styles.placeholder}>Fetching from backend...</div>
            ) : uploadedUrl && !imageError ? (
              <img
                src={uploadedUrl}
                alt={`Group ${groupId} Avatar`}
                className={styles.avatarImg}
                onError={() => {
                  console.error('Image failed to load in browser:', uploadedUrl);
                  setImageError(true);
                }}
              />
            ) : imageError ? (
              <div className={styles.placeholder}>⚠️ Image link failed to load (Check R2 CORS/URL)</div>
            ) : (
              <div className={styles.placeholder}>No avatar set in database</div>
            )}
          </div>

          {uploadedUrl ? (
            <>
              <div className={styles.urlBox}>
                <span className={styles.urlLabel}>R2 Public URL:</span>
                <a href={uploadedUrl} target="_blank" rel="noreferrer" className={styles.urlLink}>
                  {uploadedUrl}
                </a>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Group Avatar
              </button>
            </>
          ) : (
            <p className={styles.infoText}>
              Select an image on the left and click upload to save it to Cloudflare R2 for Group {groupId}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}