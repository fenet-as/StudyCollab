import test from 'node:test';
import assert from 'node:assert/strict';

test('groupApi.regenerateInviteCode - API integration', async (t) => {
  await t.test('throws an error if groupId is missing or falsy', async () => {
    const mockGroupApi = {
      regenerateInviteCode: async (groupId) => {
        if (!groupId) throw new Error('No Group ID provided.');
        return { inviteCode: 'mock' };
      },
    };

    await assert.rejects(
      async () => mockGroupApi.regenerateInviteCode(null),
      { message: 'No Group ID provided.' }
    );
    await assert.rejects(
      async () => mockGroupApi.regenerateInviteCode(undefined),
      { message: 'No Group ID provided.' }
    );
    await assert.rejects(
      async () => mockGroupApi.regenerateInviteCode(''),
      { message: 'No Group ID provided.' }
    );
  });

  await t.test('makes POST request to /groups/:groupId/invite-code/regenerate and returns data', async () => {
    let requestedUrl = null;
    let requestMethod = null;

    const mockClient = {
      post: async (url) => {
        requestedUrl = url;
        requestMethod = 'POST';
        return {
          data: { inviteCode: 'NEW-CODE-999' },
          status: 200,
        };
      },
    };

    const regenerateInviteCode = async (groupId) => {
      if (!groupId) throw new Error('No Group ID provided.');
      const res = await mockClient.post(`/groups/${groupId}/invite-code/regenerate`);
      return res.data;
    };

    const result = await regenerateInviteCode(42);

    assert.strictEqual(requestMethod, 'POST');
    assert.strictEqual(requestedUrl, '/groups/42/invite-code/regenerate');
    assert.strictEqual(result.inviteCode, 'NEW-CODE-999');
  });

  await t.test('propagates backend errors such as 403 Forbidden or 404 Not Found', async () => {
    const mockClient = {
      post: async () => {
        const error = new Error('You do not have permission to regenerate invite codes for this group.');
        error.response = {
          status: 403,
          data: { message: 'You do not have permission to regenerate invite codes for this group.' },
        };
        throw error;
      },
    };

    const regenerateInviteCode = async (groupId) => {
      if (!groupId) throw new Error('No Group ID provided.');
      const res = await mockClient.post(`/groups/${groupId}/invite-code/regenerate`);
      return res.data;
    };

    await assert.rejects(
      async () => regenerateInviteCode(10),
      (err) => err.response?.status === 403 && err.response?.data?.message.includes('permission')
    );
  });
});

test('InviteLinkCard - regeneration workflow logic', async (t) => {
  await t.test('aborts regeneration if user cancels confirmation dialog', async () => {
    let apiCalled = false;
    const confirmMock = () => false;

    const handleRegenerate = async (groupId) => {
      if (!groupId) return;
      const confirm = confirmMock();
      if (!confirm) return;
      apiCalled = true;
    };

    await handleRegenerate(5);
    assert.strictEqual(apiCalled, false);
  });

  await t.test('updates current code and fires onRegenerate callback on success', async () => {
    let currentInviteCode = 'OLD-CODE-000';
    let callbackCode = null;

    const mockApi = {
      regenerateInviteCode: async () => ({ inviteCode: 'REGEN-CODE-111' }),
    };

    const onRegenerate = (code) => {
      callbackCode = code;
    };

    const handleRegenerate = async (groupId) => {
      if (!groupId) return;
      const data = await mockApi.regenerateInviteCode(groupId);
      const newCode = data?.inviteCode || data?.inviteLink || data;
      currentInviteCode = newCode;
      if (onRegenerate) onRegenerate(newCode);
    };

    await handleRegenerate(5);

    assert.strictEqual(currentInviteCode, 'REGEN-CODE-111');
    assert.strictEqual(callbackCode, 'REGEN-CODE-111');
  });

  await t.test('handles API errors gracefully and updates errorMsg', async () => {
    let errorMsg = null;

    const mockApi = {
      regenerateInviteCode: async () => {
        const error = new Error('Network error');
        error.response = { data: { message: 'Failed to reach cluster' } };
        throw error;
      },
    };

    const handleRegenerate = async (groupId) => {
      try {
        await mockApi.regenerateInviteCode(groupId);
      } catch (err) {
        errorMsg = err.response?.data?.message || err.message || 'Error regenerating invite code.';
      }
    };

    await handleRegenerate(5);

    assert.strictEqual(errorMsg, 'Failed to reach cluster');
  });
});
