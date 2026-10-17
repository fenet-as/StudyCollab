import { api } from './config.js';

export const tasksApi = {
  getTasksByGroup: async (groupId) => (await api.get(`/tasks/group/${groupId}`)).data,
  createTask: async (taskData) => (await api.post('/tasks', taskData)).data,
  updateTask: async (taskId, taskData) => (await api.put(`/tasks/${taskId}`, taskData)).data,
  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    return true;
  },
};