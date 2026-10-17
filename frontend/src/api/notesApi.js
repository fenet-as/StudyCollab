import { api } from './config.js';

export const notesApi = {
  getByGroup: async (groupId) => (await api.get(`/notes/group/${groupId}`)).data,
  create: async (noteData) => (await api.post('/notes', noteData)).data,
  update: async (id, noteData) => (await api.put(`/notes/${id}`, noteData)).data,
  delete: async (id) => (await api.delete(`/notes/${id}`)).data,
};