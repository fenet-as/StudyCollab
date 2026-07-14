// frontend/src/api/groupApi.js

const BASE_URL = 'http://localhost:8080/api/groups';

// Reusable helper to generate security headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

export const groupApi = {
  // Fetch only the groups the current user belongs to
  getMyGroups: async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BASE_URL}/my-groups`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to fetch user groups');
    }

    return await response.json();
  },

  // Create a new group using multipart/form-data for image uploads
  createGroup: async (groupData, avatarFile) => {
    const token = localStorage.getItem('token'); 
    const formData = new FormData();

    const jsonBlob = new Blob([JSON.stringify(groupData)], {
      type: 'application/json'
    });
    
    formData.append('groupData', jsonBlob);

    if (avatarFile) {
      formData.append('avatarFile', avatarFile);
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to create study group');
    }

    return await response.json();
  },

  // Delete a study group
  deleteGroup: async (groupId) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/${groupId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to delete study group');
    }

    return true;
  },

  // ==========================================
  //       GROUP SETTINGS & MEMBERSHIP
  // ==========================================

  // Update group name and description
  updateGroupDetails: async (groupId, { name, description }) => {
    const response = await fetch(`${BASE_URL}/${groupId}/details`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to update group details');
    }

    return await response.json();
  },

  // Add a member to the group by email (supports any domain)
  addMemberByEmail: async (groupId, email) => {
    const response = await fetch(`${BASE_URL}/${groupId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to add classmate to study group');
    }

    return await response.json();
  },

  // Promote a standard member to Admin (requires user's database ID)
  promoteMemberToAdmin: async (groupId, memberUserId) => {
    const response = await fetch(`${BASE_URL}/${groupId}/members/${memberUserId}/promote`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to promote member');
    }

    return await response.json();
  }
};