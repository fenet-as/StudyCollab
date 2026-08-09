// src/api/groupOverviewApi.js

// ⚠️ Explicitly target Spring Boot backend port
const BASE_URL = `${import.meta.env.VITE_API_URL}/api/groups`;

export async function fetchGroupOverview(groupId) {
  if (!groupId) {
    throw new Error('No Group ID provided.');
  }

  const token = localStorage.getItem('token');

  const response = await fetch(`${BASE_URL}/${groupId}/overview`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch group overview (Status: ${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData?.message) errorMessage = errorData.message;
    } catch {
      // Ignore if response was not valid JSON (e.g., 404/500 HTML page)
    }
    throw new Error(errorMessage);
  }

  return response.json();
}