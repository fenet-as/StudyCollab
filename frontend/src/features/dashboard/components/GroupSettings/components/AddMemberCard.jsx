import React, { useState, useEffect } from 'react';
import { groupApi } from '../../../../../api/groupApi';
import styles from './AddMemberCard.module.css';

export default function AddMemberCard({ groupId, onMemberAdded }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-dismiss the message after 4 seconds
  useEffect(() => {
    if (!message.text) return;

    const timer = setTimeout(() => {
      setMessage({ text: '', isError: false });
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    try {
      const updatedGroup = await groupApi.addMemberByEmail(groupId, email);
      setEmail('');
      setMessage({ text: 'Member added successfully!', isError: false });
      if (onMemberAdded) onMemberAdded(updatedGroup);
    } catch (error) {
      setMessage({ text: error.message || 'Could not add member.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconBox}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235B8.967 8.967 0 0110.5 18c2.485 0 4.735.981 6.5 2.583" />
          </svg>
        </div>
        <div>
          <h3>Add Members</h3>
          <p className={styles.subtitle}>Instantly add classmates by email address.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter classmate's email address..."
            required
            className={styles.input}
          />
          <button type="submit" className={styles.addBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </button>
        </div>

        {message.text && (
          <p className={message.isError ? styles.errorMsg : styles.successMsg}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}