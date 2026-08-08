// src/features/dashboard/components/utils/errorHelpers.js

export const getFriendlyErrorMessage = (error, defaultMessage) => {
  if (!error?.response) {
    return "Network error. Please check your internet connection and try again.";
  }

  const status = error.response.status;
  const serverMessage = error.response.data?.message || error.response.data;

  if (status === 404) {
    return "The password update feature could not be found on the server. Please contact support or check back later.";
  }
  if (status === 401 || status === 403) {
    return "Your session has expired. Please log out and log back in.";
  }
  if (status === 400 && typeof serverMessage === 'string') {
    const lower = serverMessage.toLowerCase();
    if (lower.includes("password")) {
      return "The current password you entered is incorrect.";
    }
    if (lower.includes("size") || lower.includes("large")) {
      return "The file is too large. Please select an image under 2MB.";
    }
  }
  if (status === 500) {
    return "Something went wrong on our end. Please try again in a few minutes.";
  }

  return typeof serverMessage === 'string' && serverMessage ? serverMessage : defaultMessage;
};