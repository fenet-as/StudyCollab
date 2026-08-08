import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { userApi } from '../../../../../api/userApi'
import { getFriendlyErrorMessage } from '../utils/errorHelpers';
import styles from './PasswordCard.module.css';

export default function PasswordCard() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      setMessage({ text: 'Your new password must be at least 6 characters long.', isError: true });
      setTimeout(() => setMessage({ text: '', isError: false }), 5000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'Your new passwords do not match.', isError: true });
      setTimeout(() => setMessage({ text: '', isError: false }), 5000);
      return;
    }

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      await userApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ text: 'Password changed successfully!', isError: false });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Password submission error: ", err);
      const errorText = getFriendlyErrorMessage(
        err,
        'Failed to change password. Make sure your current password is correct.'
      );
      setMessage({ text: errorText, isError: true });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage({ text: '', isError: false });
      }, 5000);
    }
  };

  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>
          <Lock size={20} />
        </span>
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
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
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
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
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
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Repeat new password"
              required
            />
          </div>
        </div>

        {message.text && (
          <p className={message.isError ? styles.errorMsg : styles.successMsg}>
            {message.text}
          </p>
        )}

        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}