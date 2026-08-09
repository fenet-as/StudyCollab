// frontend/src/api/tasksApi.js
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/tasks`;

// Reusable helper to generate security headers matching groupApi.js
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

export const tasksApi = {
  // Scopes and fetches ONLY tasks that match the active group's ID
  getTasksByGroup: async (groupId) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/group/${groupId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  // Sends the payload (including groupId) to create a new task record
  createTask: async (taskData) => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  // Updates properties (like moving status between 'TODO' and 'DONE')
  updateTask: async (taskId, taskData) => {
    const response = await fetch(`${API_BASE_URL}/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  // Deletes an individual task record by its database ID
  deleteTask: async (taskId) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return true;
  }
};