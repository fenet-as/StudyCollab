/**
 * Validate channel name string according to backend constraints:
 * Lowercase alphanumeric and hyphens only, 2-50 characters.
 *
 * @param {string} name
 * @returns {string|null} Error message or null if valid
 */
export const validateChannelName = (name) => {
  if (!name || !name.trim()) {
    return 'Channel name is required.';
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Channel name must be at least 2 characters.';
  }
  if (trimmed.length > 50) {
    return 'Channel name cannot exceed 50 characters.';
  }
  if (!/^[a-z0-9-]+$/.test(trimmed)) {
    return 'Channel name must contain only lowercase letters, numbers, and hyphens.';
  }
  return null;
};

/**
 * Validate chat message content (1-1000 characters).
 *
 * @param {string} content
 * @returns {string|null} Error message or null if valid
 */
export const validateChatMessage = (content) => {
  if (!content || !content.trim()) {
    return 'Message content cannot be empty.';
  }
  if (content.length > 1000) {
    return 'Message content cannot exceed 1000 characters.';
  }
  return null;
};

/**
 * Format member role for display.
 *
 * @param {string} role
 * @returns {string} Formatted role title
 */
export const formatMemberRole = (role) => {
  if (!role) return 'Member';
  const upper = String(role).toUpperCase();
  if (upper === 'CREATOR' || upper === 'OWNER') return 'Creator';
  if (upper === 'ADMIN') return 'Admin';
  return 'Member';
};

/**
 * Get 1-2 initials for member avatar.
 *
 * @param {string} name
 * @param {string} email
 * @returns {string} Initials
 */
export const getMemberInitials = (name, email) => {
  const display = name || email || 'U';
  const parts = display.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return display.substring(0, 2).toUpperCase();
};
