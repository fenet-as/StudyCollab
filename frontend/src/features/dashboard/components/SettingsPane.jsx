// frontend/src/features/dashboard/components/SettingsPane.jsx
import React, { useState, useEffect } from 'react';
import Avatar from '../../../components/common/Avatar/Avatar';
import { userApi } from '../../../api/userApi';
import styles from './SettingsPane.module.css';

// 👤 1. Destructured 'onProfileUpdated' prop from the parent Dashboard component
export default function SettingsPane({ onProfileUpdated }) {
  // Account Information State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', isError: false });

  // Profile Picture State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ text: '', isError: false });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });

  // Helper function to turn confusing backend errors into simple, friendly text
  const getFriendlyErrorMessage = (error, defaultMessage) => {
    if (!error.response) {
      return "Network error. Please check your internet connection and try again.";
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.message || error.response.data;

    if (status === 404) {
      return "The password update feature could not be found on the server. Please contact support or check back later.";
    }
    if (status === 401 || status === 403) {
      return "Your session has expired. Please log out and log back in.";
    }
    if (status === 400 && typeof serverMessage === 'string') {
      if (serverMessage.toLowerCase().includes("password")) {
        return "The current password you entered is incorrect.";
      }
      if (serverMessage.toLowerCase().includes("size") || serverMessage.toLowerCase().includes("large")) {
        return "The file is too large. Please select an image under 2MB.";
      }
    }
    if (status === 500) {
      return "Something went wrong on our end. Please try again in a few minutes.";
    }

    return typeof serverMessage === 'string' && serverMessage ? serverMessage : defaultMessage;
  };

  // Load account details when the page opens
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await userApi.getCurrentUser();
        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setAvatarUrl(data.avatarUrl || '');
        
        if (data.fullName) localStorage.setItem('fullName', data.fullName);
        if (data.avatarUrl) localStorage.setItem('avatarUrl', data.avatarUrl);
      } catch (err) {
        console.error("Could not load user settings data:", err);
      }
    };
    loadUserData();
  }, []);

  // Handler 1: Profile Picture Change (Auto-clears after 5 seconds)
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAvatarMessage({ text: 'The photo must be smaller than 2MB.', isError: true });
      setTimeout(() => setAvatarMessage({ text: '', isError: false }), 5000);
      return;
    }

    setAvatarLoading(true);
    setAvatarMessage({ text: '', isError: false });

    try {
      const data = await userApi.updateAvatar(file);
      setAvatarUrl(data.avatarUrl);
      localStorage.setItem('avatarUrl', data.avatarUrl);
      setAvatarMessage({ text: 'Profile picture updated successfully!', isError: false });
      
      // 👤 2. Alert the parent Dashboard that the avatar url has changed
      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated();
      }
    } catch (err) {
      const errorText = getFriendlyErrorMessage(err, 'Failed to upload photo. Please try a different file.');
      setAvatarMessage({ text: errorText, isError: true });
    } finally {
      setAvatarLoading(false);
      // 💡 Auto-clear the message banner after 5 seconds
      setTimeout(() => {
        setAvatarMessage({ text: '', isError: false });
      }, 5000);
    }
  };

  // Handler 2: Name Update (Auto-clears after 5 seconds)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ text: '', isError: false });

    try {
      await userApi.updateProfileName(fullName);
      localStorage.setItem('fullName', fullName);
      setProfileMessage({ text: 'Name updated successfully!', isError: false });
      
      // 👤 3. Trigger the dashboard state refresh dynamically so the sidebar updates instantly!
      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated();
      }
    } catch (err) {
      const errorText = getFriendlyErrorMessage(err, 'Failed to update name. Please try again.');
      setProfileMessage({ text: errorText, isError: true });
    } finally {
      setProfileLoading(false);
      // 💡 Auto-clear the message banner after 5 seconds
      setTimeout(() => {
        setProfileMessage({ text: '', isError: false });
      }, 5000);
    }
  };

  // Handler 3: Change Password (Auto-clears after 5 seconds)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ text: 'Your new password must be at least 6 characters long.', isError: true });
      setTimeout(() => setPasswordMessage({ text: '', isError: false }), 5000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ text: 'Your new passwords do not match.', isError: true });
      setTimeout(() => setPasswordMessage({ text: '', isError: false }), 5000);
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage({ text: '', isError: false });

    try {
      await userApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordMessage({ text: 'Password changed successfully!', isError: false });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Password submission error: ", err);
      const errorText = getFriendlyErrorMessage(err, 'Failed to change password. Make sure your current password is correct.');
      setPasswordMessage({ text: errorText, isError: true });
    } finally {
      setPasswordLoading(false);
      // 💡 Auto-clear the message banner after 5 seconds
      setTimeout(() => {
        setPasswordMessage({ text: '', isError: false });
      }, 5000);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h2>Account Settings</h2>
        <p>Manage your profile info, change your picture, and update your password.</p>
        
        <div className={styles.currentUserBadge}>
          Signed in as: <strong>{email || 'Loading account...'}</strong>
        </div>
      </div>

      <div className={styles.settingsVerticalLayout}>
        
        {/* CARD 1: PROFILE PICTURE */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🖼️</span>
            <div>
              <h3>Profile Picture</h3>
              <p className={styles.cardSubtitle}>This photo will be shown to your group members.</p>
            </div>
          </div>

          <div className={styles.avatarWorkspaceBody}>
            <div className={styles.avatarPreviewFrame}>
              <Avatar src={avatarUrl} name={fullName} size="large" />
              {avatarLoading && (
                <div className={styles.avatarBlurOverlay}>
                  <span className={styles.spinnerIcon}>⏳</span>
                </div>
              )}
            </div>

            <div className={styles.avatarControlColumn}>
              <label htmlFor="isolated-avatar-input" className={styles.primaryUploadAction}>
                {avatarLoading ? 'Uploading...' : 'Choose New Photo'}
              </label>
              <input 
                id="isolated-avatar-input" 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleAvatarChange} 
                disabled={avatarLoading}
                style={{ display: 'none' }} 
              />
              <p className={styles.metaHintText}>Supports JPG or PNG images. Maximum size is 2MB.</p>
            </div>
          </div>

          {avatarMessage.text && (
            <p className={avatarMessage.isError ? styles.errorMsg : styles.successMsg}>
              {avatarMessage.text}
            </p>
          )}
        </div>

        {/* CARD 2: PROFILE DETAILS */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>👤</span>
            <div>
              <h3>Personal Info</h3>
              <p className={styles.cardSubtitle}>Update your account details here.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className={styles.settingsForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Mason"
                required
              />
            </div>

            <div className={styles.emailDisplayContainer}>
              <span className={styles.emailLabel}>Account Email Address</span>
              <span className={styles.emailValue}>{email || 'Retrieving email...'}</span>
            </div>

            {profileMessage.text && (
              <p className={profileMessage.isError ? styles.errorMsg : styles.successMsg}>
                {profileMessage.text}
              </p>
            )}

            <button type="submit" className={styles.saveBtn} disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* CARD 3: CHANGE PASSWORD */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🔒</span>
            <div>
              <h3>Password & Security</h3>
              <p className={styles.cardSubtitle}>Change your password to keep your account safe.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className={styles.settingsForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className={styles.formRowSplit}>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            {passwordMessage.text && (
              <p className={passwordMessage.isError ? styles.errorMsg : styles.successMsg}>
                {passwordMessage.text}
              </p>
            )}

            <button type="submit" className={styles.saveBtn} disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}