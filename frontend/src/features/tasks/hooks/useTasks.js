// frontend/src/features/tasks/hooks/useTasks.js
import { useState, useEffect } from 'react';
import { tasksApi } from '../../../api/tasksApi';
import { groupApi } from '../../../api/groupApi';

export function useTasks(groupId) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) {
      setTasks([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch tasks and lightweight member summary concurrently
        const [tasksData, membersSummary] = await Promise.all([
          tasksApi.getTasksByGroup(groupId),
          groupApi.getGroupMembersSummary(groupId)
        ]);

        setTasks(tasksData || []);

        // Normalize the backend GroupMemberSummaryDto list
        const normalizedMembers = (membersSummary || []).map((m) => {
          const uId = m.id;
          const uName = m.name || m.fullName || `Member #${uId}`;

          return {
            id: uId,
            userId: uId,
            fullName: uName,
            name: uName,
            email: m.email || ''
          };
        });

        setMembers(normalizedMembers);
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
      const resolvedGroupId = taskPayload.groupId || groupId;
      const freshTask = await tasksApi.createTask({
        ...taskPayload,
        groupId: resolvedGroupId ? Number(resolvedGroupId) : null
      });

      setTasks((prev) => [...prev, freshTask]);
      return freshTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, updatedFields) => {
    try {
      const updatedTask = await tasksApi.updateTask(taskId, updatedFields);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await tasksApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { tasks, members, loading, error, createTask, updateTask, deleteTask };
}