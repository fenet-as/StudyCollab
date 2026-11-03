import { useState, useEffect, useCallback } from 'react';
import { chatApi } from '../../../api/chatApi.js';

/**
 * Custom hook managing channel navigation, dynamic channel list retrieval,
 * channel creation, and channel deletion for a study group.
 *
 * @param {Object} options
 * @param {number|string} options.groupId - Active study group ID
 * @returns {Object} Channel state and action handlers
 */
export function useChannels({ groupId }) {
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChannels = useCallback(async () => {
    if (!groupId) {
      setChannels([]);
      setActiveChannelId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.getChannels(groupId);
      const channelList = Array.isArray(data) ? data : [];
      setChannels(channelList);

      // Preserve existing active channel if still present; otherwise default to default channel or first channel
      setActiveChannelId((prevId) => {
        if (prevId && channelList.some((c) => String(c.id) === String(prevId))) {
          return prevId;
        }
        const defaultChannel =
          channelList.find((c) => c.isDefault || c.name === 'general') || channelList[0];
        return defaultChannel ? defaultChannel.id : null;
      });
    } catch (err) {
      console.error('Failed to load channels:', err);
      setError(err.message || 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const selectChannel = useCallback((channelId) => {
    setActiveChannelId(channelId);
  }, []);

  const createChannel = useCallback(
    async ({ name, description }) => {
      if (!groupId) throw new Error('No active group selected');
      setError(null);
      try {
        const newChannel = await chatApi.createChannel(groupId, { name, description });
        setChannels((prev) => [...prev, newChannel]);
        setActiveChannelId(newChannel.id);
        return newChannel;
      } catch (err) {
        console.error('Failed to create channel:', err);
        throw err;
      }
    },
    [groupId]
  );

  const deleteChannel = useCallback(
    async (channelId) => {
      if (!groupId || !channelId) return;
      try {
        await chatApi.deleteChannel(groupId, channelId);
        setChannels((prev) => {
          const updated = prev.filter((c) => String(c.id) !== String(channelId));
          // If the deleted channel was selected, fall back to default channel
          if (String(activeChannelId) === String(channelId)) {
            const fallback =
              updated.find((c) => c.isDefault || c.name === 'general') || updated[0];
            setActiveChannelId(fallback ? fallback.id : null);
          }
          return updated;
        });
      } catch (err) {
        console.error('Failed to delete channel:', err);
        throw err;
      }
    },
    [groupId, activeChannelId]
  );

  const activeChannel =
    channels.find((c) => String(c.id) === String(activeChannelId)) || null;

  return {
    channels,
    activeChannelId,
    activeChannel,
    loading,
    error,
    selectChannel,
    createChannel,
    deleteChannel,
    refreshChannels: fetchChannels,
  };
}
