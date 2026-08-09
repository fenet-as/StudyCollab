// frontend/src/api/groupApi.js

const BASE_URL = `https://studycollab-l3p2.onrender.com/api/groups`;

// Reusable helper to generate security headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

export const groupApi = {
  // Fetch only the groups the current user belongs to
  getMyGroups: async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/my-groups`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to fetch user groups");
    }

    return await response.json();
  },

  // Create a new group using multipart/form-data for image uploads
  createGroup: async (groupData, avatarFile) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    const jsonBlob = new Blob([JSON.stringify(groupData)], {
      type: "application/json",
    });

    formData.append("groupData", jsonBlob);

    if (avatarFile) {
      formData.append("avatarFile", avatarFile);
    }

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to create study group");
    }

    return await response.json();
  },

  // Delete a study group
  deleteGroup: async (groupId) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/${groupId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to delete study group");
    }

    return true;
  },

  // ==========================================
  //        GROUP SETTINGS & MEMBERSHIP
  // ==========================================

// frontend/src/api/groupApi.js

// 1. Add uploadGroupAvatar method
uploadGroupAvatar: async (groupId, avatarFile) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  
  // Backend expects @RequestParam("file")
  formData.append("file", avatarFile);

  const response = await fetch(`${BASE_URL}/${groupId}/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set "Content-Type" manually when sending FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to upload avatar");
  }

  return await response.json(); // Returns { groupId, avatarUrl }
},

// 2. Update updateGroupDetails to handle text update + image upload sequentially
updateGroupDetails: async (groupId, { name, description }, avatarFile) => {
  const token = localStorage.getItem("token");

  // Step A: Update Group Name & Description (PUT /api/groups/{groupId}/details)
  const detailsResponse = await fetch(`${BASE_URL}/${groupId}/details`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });

  if (!detailsResponse.ok) {
    const errText = await detailsResponse.text();
    throw new Error(errText || "Failed to update group details");
  }

  let updatedGroup = await detailsResponse.json();

  // Step B: Upload Avatar if user chose a new file (POST /api/groups/{groupId}/avatar)
  if (avatarFile) {
    const avatarData = await groupApi.uploadGroupAvatar(groupId, avatarFile);
    // Merge returned avatarUrl into updatedGroup object
    updatedGroup = {
      ...updatedGroup,
      avatar: avatarData.avatarUrl,
      avatarUrl: avatarData.avatarUrl,
    };
  }

  return updatedGroup;
},





  // Join a group via invite code or full link
  joinGroupByInviteCode: async (inviteCode) => {
    const response = await fetch(`${BASE_URL}/join`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ inviteCode }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to join group");
    }

    return await response.json();
  },

  // Add a member to the group by email (supports any domain)
  addMemberByEmail: async (groupId, email) => {
    const response = await fetch(`${BASE_URL}/${groupId}/members`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to add classmate to study group");
    }

    return await response.json();
  },

  // Promote a standard member to Admin (requires user's database ID)
  promoteMemberToAdmin: async (groupId, memberUserId) => {
    const response = await fetch(
      `${BASE_URL}/${groupId}/members/${memberUserId}/promote`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to promote member");
    }

    return await response.json();
  },

  // Demote an Administrator back to a standard Member
  demoteAdminToMember: async (groupId, memberUserId) => {
    const response = await fetch(
      `${BASE_URL}/${groupId}/members/${memberUserId}/demote`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to demote administrator");
    }

    return await response.json();
  },

  // Remove a member entirely from the group
  removeMember: async (groupId, memberUserId) => {
    const response = await fetch(
      `${BASE_URL}/${groupId}/members/${memberUserId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to remove member");
    }

    return await response.json();
  },

  // Leave a study group (For non-owners)
  leaveGroup: async (groupId) => {
    const response = await fetch(`${BASE_URL}/${groupId}/leave`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to leave study group");
    }

    return await response.json();
  },



// frontend/src/api/groupApi.js

getGroupPermissions: async (groupId) => {
  const response = await fetch(`${BASE_URL}/${groupId}/permissions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to fetch permissions");
  }

  return await response.json();
},




// Fetch lightweight group member summary (id, name, email)
  getGroupMembersSummary: async (groupId) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/${groupId}/members`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || "Failed to fetch group members");
    }

    return await response.json();
  }


};