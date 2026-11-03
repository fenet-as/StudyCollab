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
