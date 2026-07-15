// frontend/src/context/GroupContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { groupApi } from '../api/groupApi';

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FETCH GROUPS ON INITIAL STARTUP
  useEffect(() => {
    const fetchUserGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await groupApi.getMyGroups();
        setGroups(data);
      } catch (err) {
        console.error("Error loading user groups into context:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Only run if we have a token (meaning the user is logged in)
    if (localStorage.getItem('token')) {
      fetchUserGroups();
    }
  }, []);

  const createNewGroup = async (groupData, avatarFile) => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupApi.createGroup(groupData, avatarFile);
      setGroups((prevGroups) => [...prevGroups, data]);
      return data; // Return to modal wrapper to signal structural success closeout
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <GroupContext.Provider value={{ groups, createNewGroup, loading, error }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroupsContext = () => useContext(GroupContext);