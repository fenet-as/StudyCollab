import React, { useState, useEffect, useCallback } from 'react';
import { GroupContext } from './groupContextInstance';
import { groupApi } from '../api/groupApi';

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches all groups for the authenticated user and selects active group.
   *
   * @param {number|null} [selectGroupId] - Optional ID of group to activate
   * @returns {Promise<Array>} Fetched list of groups
   */
  const fetchGroups = useCallback(async (selectGroupId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupApi.getMyGroups();
      const groupList = Array.isArray(data) ? data : [];
      setGroups(groupList);

      if (groupList.length > 0) {
        if (selectGroupId) {
          const target = groupList.find((g) => g.id === selectGroupId);
          setActiveGroup(target || groupList[0]);
        } else {
          setActiveGroup((prevActive) => {
            if (prevActive) {
              const current = groupList.find((g) => g.id === prevActive.id);
              return current || groupList[0];
            }
            return groupList[0];
          });
        }
      } else {
        setActiveGroup(null);
      }
      return groupList;
    } catch (err) {
      console.error('Error loading user groups into context:', err);
      setError(err.message || 'Failed to load user groups');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user groups on startup if authenticated
  useEffect(() => {
    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchGroups().catch(() => {});
    }
  }, [fetchGroups]);

  // Listen for session expiration to clear groups state
  useEffect(() => {
    const handleSessionExpired = () => {
      setGroups([]);
      setActiveGroup(null);
      setError(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('studycollab:session_expired', handleSessionExpired);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('studycollab:session_expired', handleSessionExpired);
      }
    };
  }, []);

  /**
   * Creates a new group and automatically selects it as the active group.
   */
  const createNewGroup = async (groupData, avatarFile) => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupApi.createGroup(groupData, avatarFile);
      setGroups((prev) => [...prev, data]);
      setActiveGroup(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a group by ID and updates active group if deleted group was selected.
   */
  const deleteGroup = async (groupId) => {
    await groupApi.deleteGroup(groupId);
    setGroups((prev) => {
      const remaining = prev.filter((g) => g.id !== groupId);
      setActiveGroup((prevActive) => {
        if (prevActive?.id === groupId) {
          return remaining.length > 0 ? remaining[0] : null;
        }
        return prevActive;
      });
      return remaining;
    });
  };

  /**
   * Updates a group in the list and preserves active group reference.
   */
  const updateGroup = (updatedGroup) => {
    if (!updatedGroup) return;
    setGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    );
    setActiveGroup((prevActive) =>
      prevActive?.id === updatedGroup.id ? updatedGroup : prevActive
    );
  };

  /**
   * Removes a group from local list when the current user leaves it.
   */
  const leaveGroup = (groupId) => {
    setGroups((prev) => {
      const remaining = prev.filter((g) => g.id !== groupId);
      setActiveGroup((prevActive) => {
        if (prevActive?.id === groupId) {
          return remaining.length > 0 ? remaining[0] : null;
        }
        return prevActive;
      });
      return remaining;
    });
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        setActiveGroup,
        loading,
        error,
        fetchGroups,
        createNewGroup,
        deleteGroup,
        updateGroup,
        leaveGroup,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};