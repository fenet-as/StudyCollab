// frontend/src/features/tasks/hooks/useTasks.js
import { useState, useEffect } from 'react';
import { tasksApi } from '../../../api/tasksApi';
import { groupApi } from '../../../api/groupApi'; // Import groupApi to fetch members

export function useTasks(groupId) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]); // Real members state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch both tasks and members for this group in parallel
        const [tasksData, groupData] = await Promise.all([
          tasksApi.getTasksByGroup(groupId),
          groupApi.getMyGroups() // Grabs groups to find members or add a dedicated getMembers endpoint if available
        ]);
        
        setTasks(tasksData);

        // Find the active group from the user's groups to extract its members list
        const activeGroup = groupData.find(g => g.id === groupId || g.id === Number(groupId));
        if (activeGroup && activeGroup.members) {
          setMembers(activeGroup.members);
        } else if (activeGroup && activeGroup.groupMembers) {
          setMembers(activeGroup.groupMembers); // Fallback depending on your backend entity naming
        }
      } catch (err) {
        console.error("Error fetching tasks/members:", err);
        setError(err.message || 'Failed to sync with data server');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId]);

  const createTask = async (taskPayload) => {
    try {
      // Ensure the validated, numeric groupId from TaskPages handles precedence,
      // falling back to hook's state only if undefined.
      const resolvedGroupId = taskPayload.groupId || groupId;
      
      const freshTask = await tasksApi.createTask({ 
        ...taskPayload, 
        groupId: resolvedGroupId ? Number(resolvedGroupId) : null 
      });
      
      setTasks(prev => [...prev, freshTask]);
      return freshTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, updatedFields) => {
    try {
      const updatedTask = await tasksApi.updateTask(taskId, updatedFields);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await tasksApi.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { tasks, members, loading, error, createTask, updateTask, deleteTask };
}