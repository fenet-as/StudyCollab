import React from 'react';
import { User } from 'lucide-react';
import styles from './Avatar.module.css';

export default function Avatar({ src, name, size = 'medium', className = '' }) {
  // Extract up to 2 uppercase initials from the provided full name
  const getInitials = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  const sizeClass = styles[size] || styles.medium;

  return (
    <div className={`${styles.avatarContainer} ${sizeClass} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name ? `${name}'s avatar` : 'User avatar'}
          className={styles.avatarImage}
        />
      ) : initials ? (
        <span className={styles.avatarInitials}>{initials}</span>
      ) : (
        <User className={styles.fallbackIcon} />
      )}
    </div>
  );
}