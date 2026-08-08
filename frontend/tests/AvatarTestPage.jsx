import React, { useState, useEffect } from 'react';
import styles from './AvatarTestPage.module.css';

const API_BASE_URL = 'http://localhost:8080';

export default function AvatarTestPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [imageError, setImageError] = useState(false);

  // 1. Fetch current user avatar on component load
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt');
      if (!token) {
        setStatusMessage({ type: 'error', text: 'No JWT token found in localStorage. Please log in.' });
        setFetchingProfile(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/avatars/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load profile. HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched User Data:', data);

        if (data.avatarUrl) {
          // 💡 Append timestamp so the browser bypasses cache and fetches the fresh image
          const formattedUrl = data.avatarUrl.includes('?') 
            ? `${data.avatarUrl}&t=${Date.now()}` 
            : `${data.avatarUrl}?t=${Date.now()}`;

          setUploadedUrl(formattedUrl);
        }
      } catch (err) {
        console.error('Failed to load user avatar:', err);
        setStatusMessage({ type: 'error', text: err.message });
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

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

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setStatusMessage(null);
    setImageError(false);

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt');

      const response = await fetch(`${API_BASE_URL}/api/avatars/upload`, {
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

      // Append timestamp on newly uploaded URL
      const formattedUrl = `${data.avatarUrl}?t=${Date.now()}`;
      setUploadedUrl(formattedUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setStatusMessage({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Avatar Upload & R2 Storage Test</h2>
      <p className={styles.subtitle}>Test local image preview and Cloudflare R2 upload pipeline.</p>

      {statusMessage && (
        <div className={`${styles.alert} ${styles[statusMessage.type]}`}>
          {statusMessage.text}
        </div>
      )}

      <div className={styles.cardGrid}>
        {/* Step A: Local File Picker */}
        <div className={styles.card}>
          <h3>1. Select New Image</h3>

          <div className={styles.previewBox}>
            {previewUrl ? (
              <img src={previewUrl} alt="Selected Local Preview" className={styles.avatarImg} />
            ) : (
              <div className={styles.placeholder}>No new image selected</div>
            )}
          </div>

          <label className={styles.fileLabel}>
            Choose File
            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
          </label>

          <button
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? 'Uploading to R2...' : 'Upload Avatar'}
          </button>
        </div>

        {/* Step B: Live Backend / R2 Image View */}
        <div className={styles.card}>
          <h3>2. Current Saved Avatar (Backend)</h3>

          <div className={styles.previewBox}>
            {fetchingProfile ? (
              <div className={styles.placeholder}>Loading avatar...</div>
            ) : uploadedUrl && !imageError ? (
              <img 
                src={uploadedUrl} 
                alt="Saved Backend Avatar" 
                className={styles.avatarImg}
                onError={() => {
                  console.error('Image failed to load in browser:', uploadedUrl);
                  setImageError(true);
                }}
              />
            ) : imageError ? (
              <div className={styles.placeholder}>⚠️ Image link returned an error (400/403)</div>
            ) : (
              <div className={styles.placeholder}>No avatar set in database</div>
            )}
          </div>

          {uploadedUrl ? (
            <div className={styles.urlBox}>
              <span className={styles.urlLabel}>Stored Public URL:</span>
              <a href={uploadedUrl} target="_blank" rel="noreferrer" className={styles.urlLink}>
                {uploadedUrl}
              </a>
            </div>
          ) : (
            <p className={styles.infoText}>
              Once uploaded, your stored profile avatar will load here automatically every time you refresh.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}