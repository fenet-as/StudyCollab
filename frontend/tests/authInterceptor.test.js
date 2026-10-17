import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {
  isAuthEndpoint,
  clearAuthStorage,
  broadcastSessionExpired,
  broadcastTokenRefreshed,
  setupAuthInterceptors,
  resetRefreshState,
} from '../src/api/authInterceptor.js';

// Setup mock browser globals for tests
function setupMockBrowser() {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };

  const listeners = {};
  globalThis.window = {
    addEventListener: (event, cb) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    },
    removeEventListener: (event, cb) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((fn) => fn !== cb);
    },
    dispatchEvent: (event) => {
      const cbs = listeners[event.type] || [];
      cbs.forEach((fn) => fn(event));
      return true;
    },
  };

  globalThis.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.detail = eventInitDict.detail;
    }
  };

  return { store, listeners };
}

test('authInterceptor - isAuthEndpoint', async (t) => {
  await t.test('detects authentication endpoints that should not trigger refresh', () => {
    assert.strictEqual(isAuthEndpoint('/auth/refresh'), true);
    assert.strictEqual(isAuthEndpoint('/api/auth/refresh'), true);
    assert.strictEqual(isAuthEndpoint('/auth/login'), true);
    assert.strictEqual(isAuthEndpoint('/auth/register'), true);
    assert.strictEqual(isAuthEndpoint('/auth/verify-email'), true);
  });

  await t.test('allows protected business endpoints to be recognized', () => {
    assert.strictEqual(isAuthEndpoint('/tasks'), false);
    assert.strictEqual(isAuthEndpoint('/notes'), false);
    assert.strictEqual(isAuthEndpoint('/groups'), false);
    assert.strictEqual(isAuthEndpoint('/users/profile'), false);
    assert.strictEqual(isAuthEndpoint(null), false);
    assert.strictEqual(isAuthEndpoint(undefined), false);
  });
});

test('authInterceptor - storage and event broadcast', async (t) => {
  setupMockBrowser();

  await t.test('clearAuthStorage removes all user session items', () => {
    localStorage.setItem('token', 'sample-token');
    localStorage.setItem('email', 'test@studycollab.com');
    localStorage.setItem('userId', '42');
    localStorage.setItem('fullName', 'Test User');
    localStorage.setItem('avatarUrl', 'https://example.com/avatar.jpg');

    clearAuthStorage();

    assert.strictEqual(localStorage.getItem('token'), null);
    assert.strictEqual(localStorage.getItem('email'), null);
    assert.strictEqual(localStorage.getItem('userId'), null);
    assert.strictEqual(localStorage.getItem('fullName'), null);
    assert.strictEqual(localStorage.getItem('avatarUrl'), null);
  });

  await t.test('broadcastSessionExpired clears storage and dispatches event', () => {
    localStorage.setItem('token', 'active-token');
    let eventReceived = null;
    const handler = (e) => {
      eventReceived = e;
    };

    window.addEventListener('studycollab:session_expired', handler);
    broadcastSessionExpired({ message: 'Token expired' });
    window.removeEventListener('studycollab:session_expired', handler);

    assert.strictEqual(localStorage.getItem('token'), null);
    assert.ok(eventReceived);
    assert.strictEqual(eventReceived.detail.message, 'Token expired');
  });

  await t.test('broadcastTokenRefreshed dispatches token update event', () => {
    let eventReceived = null;
    const handler = (e) => {
      eventReceived = e;
    };

    window.addEventListener('studycollab:token_refreshed', handler);
    broadcastTokenRefreshed({ token: 'new-jwt-token', email: 'user@test.com' });
    window.removeEventListener('studycollab:token_refreshed', handler);

    assert.ok(eventReceived);
    assert.strictEqual(eventReceived.detail.token, 'new-jwt-token');
    assert.strictEqual(eventReceived.detail.email, 'user@test.com');
  });
});

test('authInterceptor - request interceptor', async (t) => {
  setupMockBrowser();
  resetRefreshState();

  await t.test('attaches Bearer token from localStorage to outgoing requests', async () => {
    localStorage.setItem('token', 'stored-bearer-token');
    const client = axios.create();
    setupAuthInterceptors(client);

    const config = await client.interceptors.request.handlers[0].fulfilled({
      headers: {},
    });

    assert.strictEqual(config.headers.Authorization, 'Bearer stored-bearer-token');
  });

  await t.test('preserves existing custom Authorization header without overwrite', async () => {
    localStorage.setItem('token', 'stored-token');
    const client = axios.create();
    setupAuthInterceptors(client);

    const config = await client.interceptors.request.handlers[0].fulfilled({
      headers: { Authorization: 'Bearer custom-token' },
    });

    assert.strictEqual(config.headers.Authorization, 'Bearer custom-token');
  });
});

test('authInterceptor - 401 response handling and refresh flow', async (t) => {
  setupMockBrowser();
  resetRefreshState();

  await t.test('rejects non-401 errors directly without attempting refresh', async () => {
    const client = axios.create();
    setupAuthInterceptors(client);

    const error = {
      config: { url: '/tasks' },
      response: { status: 500, data: 'Server error' },
    };

    await assert.rejects(
      async () => {
        await client.interceptors.response.handlers[0].rejected(error);
      },
      (err) => err.response.status === 500
    );
  });

  await t.test('rejects 401 on /auth/refresh without attempting refresh (no infinite loop)', async () => {
    const client = axios.create();
    setupAuthInterceptors(client);

    const error = {
      config: { url: '/auth/refresh' },
      response: { status: 401, data: 'Unauthorized' },
    };

    await assert.rejects(
      async () => {
        await client.interceptors.response.handlers[0].rejected(error);
      },
      (err) => err.response.status === 401
    );
  });

  await t.test('rejects already retried request with 401 without infinite loop', async () => {
    const client = axios.create();
    setupAuthInterceptors(client);

    const error = {
      config: { url: '/notes', _retry: true },
      response: { status: 401, data: 'Still Unauthorized' },
    };

    await assert.rejects(
      async () => {
        await client.interceptors.response.handlers[0].rejected(error);
      },
      (err) => err.response.status === 401
    );
  });

  await t.test('executes refresh and retries original request with new token', async () => {
    resetRefreshState();
    localStorage.setItem('token', 'expired-token');

    let refreshCallCount = 0;
    let retriedRequestConfig = null;

    // Create mock client instance
    const mockClient = (config) => {
      retriedRequestConfig = config;
      return Promise.resolve({ data: 'retry-success', status: 200 });
    };
    mockClient.interceptors = {
      request: { use: () => {}, handlers: [] },
      response: { use: (fulfilled, rejected) => {
        mockClient.responseHandler = { fulfilled, rejected };
      }, handlers: [] },
    };
    mockClient.defaults = { headers: { common: {} } };
    mockClient.post = async (url) => {
      if (url === '/auth/refresh') {
        refreshCallCount++;
        return {
          data: {
            token: 'freshly-minted-token',
            email: 'user@studycollab.com',
            id: 99,
          },
        };
      }
      throw new Error(`Unexpected POST to ${url}`);
    };

    setupAuthInterceptors(mockClient);

    const initialError = {
      config: { url: '/notes', headers: {} },
      response: { status: 401 },
    };

    const result = await mockClient.responseHandler.rejected(initialError);

    assert.strictEqual(refreshCallCount, 1);
    assert.strictEqual(result.data, 'retry-success');
    assert.strictEqual(localStorage.getItem('token'), 'freshly-minted-token');
    assert.strictEqual(retriedRequestConfig.headers.Authorization, 'Bearer freshly-minted-token');
    assert.strictEqual(retriedRequestConfig._retry, true);
  });

  await t.test('queues concurrent 401 requests and replays all with the new token', async () => {
    resetRefreshState();
    localStorage.setItem('token', 'expired-token');

    let refreshCallCount = 0;
    const retriedCalls = [];

    // Delayed refresh resolution to test concurrent queuing
    let resolveRefresh;
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });

    const mockClient = (config) => {
      retriedCalls.push(config);
      return Promise.resolve({ data: `retried-${config.url}`, status: 200 });
    };
    mockClient.interceptors = {
      request: { use: () => {} },
      response: { use: (fulfilled, rejected) => {
        mockClient.responseHandler = { fulfilled, rejected };
      }},
    };
    mockClient.defaults = { headers: { common: {} } };
    mockClient.post = async (url) => {
      if (url === '/auth/refresh') {
        refreshCallCount++;
        await refreshPromise;
        return { data: { token: 'queued-fresh-token', email: 'multi@test.com' } };
      }
      throw new Error(`Unexpected POST to ${url}`);
    };

    setupAuthInterceptors(mockClient);

    const errorReq1 = { config: { url: '/notes', headers: {} }, response: { status: 401 } };
    const errorReq2 = { config: { url: '/tasks', headers: {} }, response: { status: 401 } };
    const errorReq3 = { config: { url: '/groups', headers: {} }, response: { status: 401 } };

    // Fire 3 simultaneous 401s
    const p1 = mockClient.responseHandler.rejected(errorReq1);
    const p2 = mockClient.responseHandler.rejected(errorReq2);
    const p3 = mockClient.responseHandler.rejected(errorReq3);

    // Let the in-flight refresh resolve
    resolveRefresh();

    const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

    // Verify only ONE refresh request was made for all 3 concurrent 401s
    assert.strictEqual(refreshCallCount, 1);

    // Verify all 3 requests received their retried responses
    assert.strictEqual(res1.data, 'retried-/notes');
    assert.strictEqual(res2.data, 'retried-/tasks');
    assert.strictEqual(res3.data, 'retried-/groups');

    // Verify each retried request had the new token
    assert.strictEqual(retriedCalls.length, 3);
    retriedCalls.forEach((req) => {
      assert.strictEqual(req.headers.Authorization, 'Bearer queued-fresh-token');
    });
  });

  await t.test('handles failed refresh by rejecting queue, clearing tokens, and dispatching expiration', async () => {
    resetRefreshState();
    localStorage.setItem('token', 'expired-token');

    let expiredEventDispatched = false;
    let resolveRefresh;
    const refreshPromise = new Promise((resolve) => {
      resolveRefresh = resolve;
    });

    const mockClient = () => Promise.resolve({});
    mockClient.interceptors = {
      request: { use: () => {} },
      response: { use: (fulfilled, rejected) => {
        mockClient.responseHandler = { fulfilled, rejected };
      }},
    };
    mockClient.defaults = { headers: { common: {} } };
    mockClient.post = async () => {
      await refreshPromise;
      const err = new Error('Refresh token expired');
      err.response = { status: 401 };
      throw err;
    };

    setupAuthInterceptors(mockClient, {
      onSessionExpired: () => {
        expiredEventDispatched = true;
        clearAuthStorage();
      },
    });

    const errorReq1 = { config: { url: '/notes', headers: {} }, response: { status: 401 } };
    const errorReq2 = { config: { url: '/tasks', headers: {} }, response: { status: 401 } };

    const p1 = mockClient.responseHandler.rejected(errorReq1);
    const p2 = mockClient.responseHandler.rejected(errorReq2);

    resolveRefresh();

    await assert.rejects(p1, (err) => err.message === 'Refresh token expired');
    await assert.rejects(p2, (err) => err.message === 'Refresh token expired');

    assert.strictEqual(expiredEventDispatched, true);
    assert.strictEqual(localStorage.getItem('token'), null);
  });
});
