import { api } from './config.js';

export const chatApi = {
  /**
   * Get all channels for a study group.
   * @param {number|string} groupId
   * @returns {Promise<Array>} List of channels
   */
  getChannels: async (groupId) => {
    const response = await api.get(`/groups/${groupId}/channels`);
    return response.data;
  },

  /**
   * Create a new channel in a study group.
   * @param {number|string} groupId
   * @param {{ name: string, description?: string }} channelData
   * @returns {Promise<Object>} Created channel
   */
  createChannel: async (groupId, channelData) => {
    const response = await api.post(`/groups/${groupId}/channels`, channelData);
    return response.data;
  },

  /**
   * Delete a channel in a study group.
   * @param {number|string} groupId
   * @param {number|string} channelId
   * @returns {Promise<void>}
   */
  deleteChannel: async (groupId, channelId) => {
    const response = await api.delete(`/groups/${groupId}/channels/${channelId}`);
    return response.data;
  },

  /**
   * Fetch paginated message history for a channel.
   * @param {number|string} channelId
   * @param {{ before?: number, limit?: number }} [params] Keyset cursor parameters
   * @returns {Promise<{ channelId: number, hasMore: boolean, nextCursor: number|null, messages: Array }>}
   */
  getMessages: async (channelId, params = {}) => {
    const response = await api.get(`/channels/${channelId}/messages`, { params });
    return response.data;
  },

  /**
   * Pin or unpin a message in a channel.
   * @param {number|string} channelId
   * @param {number|string} messageId
   * @param {boolean} isPinned
   * @returns {Promise<Object>} Updated message
   */
  pinMessage: async (channelId, messageId, isPinned) => {
    const response = await api.put(`/channels/${channelId}/messages/${messageId}/pin`, { isPinned });
    return response.data;
  },

  /**
   * Get all pinned messages in a channel.
   * @param {number|string} channelId
   * @returns {Promise<Array>} List of pinned messages
   */
  getPinnedMessages: async (channelId) => {
    const response = await api.get(`/channels/${channelId}/pinned`);
    return response.data;
  },
};

