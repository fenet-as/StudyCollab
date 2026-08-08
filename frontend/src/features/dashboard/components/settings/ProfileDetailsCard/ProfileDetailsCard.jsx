import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { userApi } from '../../../../../api/userApi'
import { getFriendlyErrorMessage } from '../utils/errorHelpers';
import styles from './ProfileDetailsCard.module.css';

export default function ProfileDetailsCard({ initialFullName, email, onProfileUpdated }) {
  const [fullName, setFullName] = useState(initialFullName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    setFullName(initialFullName || '');
  }, [initialFullName]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      await userApi.updateProfileName(fullName);
      localStorage.setItem('fullName', fullName);
      setMessage({ text: 'Name updated successfully!', isError: false });

      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated(fullName);
      }
    } catch (err) {
      const errorText = getFriendlyErrorMessage(err, 'Failed to update name. Please try again.');
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
          <User size={20} />
        </span>
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

    

        {message.text && (
          <p className={message.isError ? styles.errorMsg : styles.successMsg}>
            {message.text}
          </p>
        )}

        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Saving...' : 'Save Name'}
        </button>
      </form>
    </div>
  );
}