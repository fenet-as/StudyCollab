// frontend/src/context/GroupContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { groupApi } from '../api/groupApi';

// 1. ADD "export" HERE to fix the named export syntax error on import
export const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  // 2. ADD STATE to track the currently active group
  const [activeGroup, setActiveGroup] = useState(null);
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
        
        // OPTIONAL: Automatically select the first group if none is selected yet
        if (data && data.length > 0) {
          setActiveGroup(data[0]);
        }
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
      
      // OPTIONAL: Set newly created group as active
      setActiveGroup(data);
      
      return data; // Return to modal wrapper to signal structural success closeout
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <GroupContext.Provider 
      value={{ 
        groups, 
        activeGroup,     // Expose activeGroup
        setActiveGroup,  // Expose activeGroup setter
        createNewGroup, 
        loading, 
        error 
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroupsContext = () => useContext(GroupContext);