import { api } from './config.js';

export async function fetchGroupOverview(groupId) {
  if (!groupId) {
    throw new Error('No Group ID provided.');
  }

  // Uses the base URL, attached auth token, and error handling from central Axios instance
  const response = await api.get(`/groups/${groupId}/overview`);
  return response.data;
}