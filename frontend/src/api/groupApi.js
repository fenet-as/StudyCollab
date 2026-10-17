import { api } from './config.js';

export const groupApi = {
  getMyGroups: async () => {
    const res = await api.get('/groups/my-groups');
    return res.data;
  },

  createGroup: async (groupData, avatarFile) => {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(groupData)], {
      type: 'application/json',
    });
    formData.append('groupData', jsonBlob);
    if (avatarFile) formData.append('avatarFile', avatarFile);

    const res = await api.post('/groups', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteGroup: async (groupId) => {
    await api.delete(`/groups/${groupId}`);
    return true;
  },

  uploadGroupAvatar: async (groupId, avatarFile) => {
    const formData = new FormData();
    formData.append('file', avatarFile);

    const res = await api.post(`/groups/${groupId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateGroupDetails: async (groupId, { name, description }, avatarFile) => {
    const res = await api.put(`/groups/${groupId}/details`, { name, description });
    let updatedGroup = res.data;

    if (avatarFile) {
      const avatarData = await groupApi.uploadGroupAvatar(groupId, avatarFile);
      updatedGroup = {
        ...updatedGroup,
        avatar: avatarData.avatarUrl,
        avatarUrl: avatarData.avatarUrl,
      };
    }
    return updatedGroup;
  },

  joinGroupByInviteCode: async (inviteCode) => {
    const res = await api.post('/groups/join', { inviteCode });
    return res.data;
  },

  addMemberByEmail: async (groupId, email) => {
    const res = await api.post(`/groups/${groupId}/members`, { email });
    return res.data;
  },

  promoteMemberToAdmin: async (groupId, memberUserId) => {
    const res = await api.put(`/groups/${groupId}/members/${memberUserId}/promote`);
    return res.data;
  },

  demoteAdminToMember: async (groupId, memberUserId) => {
    const res = await api.put(`/groups/${groupId}/members/${memberUserId}/demote`);
    return res.data;
  },

  removeMember: async (groupId, memberUserId) => {
    const res = await api.delete(`/groups/${groupId}/members/${memberUserId}`);
    return res.data;
  },

  leaveGroup: async (groupId) => {
    const res = await api.post(`/groups/${groupId}/leave`);
    return res.data;
  },

  getGroupPermissions: async (groupId) => {
    const res = await api.get(`/groups/${groupId}/permissions`);
    return res.data;
  },

  getGroupMembersSummary: async (groupId) => {
    const res = await api.get(`/groups/${groupId}/members`);
    return res.data;
  },

  fetchGroupOverview: async (groupId) => {
    if (!groupId) throw new Error('No Group ID provided.');
    const res = await api.get(`/groups/${groupId}/overview`);
    return res.data;
  },

  regenerateInviteCode: async (groupId) => {
    if (!groupId) throw new Error('No Group ID provided.');
    const res = await api.post(`/groups/${groupId}/invite-code/regenerate`);
    return res.data;
  },
};