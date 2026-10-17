/**
 * Authentication and Token Refresh Interceptor for Axios.
 * Manages JWT bearer authorization headers, silent token refresh on 401s,
 * concurrent request queueing during active refreshes, and graceful session expiration.
 */

let isRefreshing = false;
let failedQueue = [];

/**
 * Resolves or rejects all promises currently waiting in the refresh queue.
 *
 * @param {Error|null} error - Error if refresh failed, null if succeeded
 * @param {string|null} token - New access token if refresh succeeded
 */
export const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Resets the refresh lock and clears queue state (primarily for testing and cleanups).
 */
export const resetRefreshState = () => {
  isRefreshing = false;
  failedQueue = [];
};

/**
 * Checks if the given URL corresponds to an authentication endpoint
 * where 401 errors must not trigger token refresh retries.
 *
 * @param {string} [url]
 * @returns {boolean}
 */
export const isAuthEndpoint = (url) => {
  if (!url) return false;
  return (
    url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/verify-email')
  );
};

/**
 * Clears authentication tokens and user credentials from local storage.
 */
export const clearAuthStorage = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('avatarUrl');
  }
};

/**
 * Dispatches a global event notifying components that the user's session has expired.
 *
 * @param {unknown} [error]
 */
export const broadcastSessionExpired = (error) => {
  clearAuthStorage();
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent('studycollab:session_expired', { detail: error })
    );
  }
};

/**
 * Dispatches a global event notifying components that the access token was refreshed.
 *
 * @param {Object} data
 */
export const broadcastTokenRefreshed = (data) => {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent('studycollab:token_refreshed', { detail: data })
    );
  }
};

/**
 * Attaches request and response interceptors to an Axios client instance.
 *
 * @param {import('axios').AxiosInstance} client - Axios instance to configure
 * @param {Object} [options] - Configuration options for endpoints and callbacks
 * @returns {import('axios').AxiosInstance} The configured Axios instance
 */
export const setupAuthInterceptors = (client, options = {}) => {
  const refreshEndpoint = options.refreshEndpoint || '/auth/refresh';
  const onSessionExpired = options.onSessionExpired || broadcastSessionExpired;
  const onTokenRefreshed = options.onTokenRefreshed || broadcastTokenRefreshed;

  // 1. Request Interceptor: inject latest Bearer token into outgoing requests
  client.interceptors.request.use(
    (config) => {
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 2. Response Interceptor: intercept 401s, refresh token, queue concurrent calls
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Only handle 401 Unauthorized errors
      if (!error.response || error.response.status !== 401) {
        return Promise.reject(error);
      }

      // Do not attempt refresh on auth endpoints (avoids infinite retry loops)
      if (!originalRequest || isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      // If this request was already retried once after refresh, reject immediately
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // If a refresh is already in flight, queue this request until refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Execute refresh using configured client (with credentials enabled)
        const refreshResponse = await client.post(
          refreshEndpoint,
          {},
          { _retry: true }
        );
        const data = refreshResponse.data;
        const newToken = data?.token;

        if (!newToken) {
          throw new Error('Refresh response did not contain an access token');
        }

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('token', newToken);
          if (data.email) localStorage.setItem('email', data.email);
          if (data.id != null) localStorage.setItem('userId', String(data.id));
        }

        client.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        onTokenRefreshed(data);
        processQueue(null, newToken);

        return client(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        onSessionExpired(refreshErr);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return client;
};
