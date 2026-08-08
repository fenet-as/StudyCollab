// src/features/dashboard/components/settings/SettingsPane.jsx

import React, { useState, useEffect } from 'react';
import { userApi } from '../../../../api/userApi'; // adjusted path
import AvatarCard from './AvatarCard/AvatarCard';
import ProfileDetailsCard from './ProfileDetailsCard/ProfileDetailsCard';
import PasswordCard from './PasswordCard/PasswordCard';
import styles from './SettingsPane.module.css';

export default function SettingsPane({ onProfileUpdated }) {
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    avatarUrl: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await userApi.getCurrentUser();
        setUserData({
          fullName: data.fullName || '',
          email: data.email || '',
          avatarUrl: data.avatarUrl || ''
        });

        if (data.fullName) localStorage.setItem('fullName', data.fullName);
        if (data.avatarUrl) localStorage.setItem('avatarUrl', data.avatarUrl);
      } catch (err) {
        console.error("Could not load user settings data:", err);
      }
    };
    loadUserData();
  }, []);

  const handleAvatarUpdated = (newAvatarUrl) => {
    setUserData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
    if (typeof onProfileUpdated === 'function') {
      onProfileUpdated();
    }
  };

  const handleProfileNameUpdated = (newFullName) => {
    setUserData((prev) => ({ ...prev, fullName: newFullName }));
    if (typeof onProfileUpdated === 'function') {
      onProfileUpdated();
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h2>Account Settings</h2>
        <p>Manage your profile info, change your picture, and update your password.</p>

        <div className={styles.currentUserBadge}>
          Signed in as: <strong>{userData.email || 'Loading account...'}</strong>
        </div>
      </div>

      <div className={styles.settingsVerticalLayout}>
        <AvatarCard
          avatarUrl={userData.avatarUrl}
          fullName={userData.fullName}
          onAvatarUpdated={handleAvatarUpdated}
        />

        <ProfileDetailsCard
          initialFullName={userData.fullName}
          email={userData.email}
          onProfileUpdated={handleProfileNameUpdated}
        />

        <PasswordCard />
      </div>
    </div>
  );
}