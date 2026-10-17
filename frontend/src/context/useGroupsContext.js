import { useContext } from 'react';
import { GroupContext } from './groupContextInstance';

export const useGroupsContext = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroupsContext must be used within a GroupProvider');
  }
  return context;
};
