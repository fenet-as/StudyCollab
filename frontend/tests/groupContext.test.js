import test from 'node:test';
import assert from 'node:assert/strict';

// Helper mock to simulate group operations logic
function createGroupState() {
  let groups = [];
  let activeGroup = null;
  let loading = false;
  let error = null;

  const getMyGroupsMock = async () => [
    { id: 1, name: 'Algorithms Study Group', description: 'CS 101' },
    { id: 2, name: 'Physics Club', description: 'Quantum mechanics' },
  ];

  const fetchGroups = async (selectGroupId = null, apiFn = getMyGroupsMock) => {
    loading = true;
    error = null;
    try {
      const data = await apiFn();
      const groupList = Array.isArray(data) ? data : [];
      groups = groupList;

      if (groupList.length > 0) {
        if (selectGroupId) {
          const target = groupList.find((g) => g.id === selectGroupId);
          activeGroup = target || groupList[0];
        } else {
          if (activeGroup) {
            const current = groupList.find((g) => g.id === activeGroup.id);
            activeGroup = current || groupList[0];
          } else {
            activeGroup = groupList[0];
          }
        }
      } else {
        activeGroup = null;
      }
      return groupList;
    } catch (err) {
      error = err.message;
      throw err;
    } finally {
      loading = false;
    }
  };

  const createNewGroup = async (groupData, createApiFn) => {
    loading = true;
    error = null;
    try {
      const data = await createApiFn(groupData);
      groups = [...groups, data];
      activeGroup = data;
      return data;
    } catch (err) {
      error = err.message;
      throw err;
    } finally {
      loading = false;
    }
  };

  const deleteGroup = async (groupId, deleteApiFn) => {
    await deleteApiFn(groupId);
    const remaining = groups.filter((g) => g.id !== groupId);
    groups = remaining;
    if (activeGroup?.id === groupId) {
      activeGroup = remaining.length > 0 ? remaining[0] : null;
    }
  };

  const leaveGroup = (groupId) => {
    const remaining = groups.filter((g) => g.id !== groupId);
    groups = remaining;
    if (activeGroup?.id === groupId) {
      activeGroup = remaining.length > 0 ? remaining[0] : null;
    }
  };

  const updateGroup = (updatedGroup) => {
    if (!updatedGroup) return;
    groups = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    if (activeGroup?.id === updatedGroup.id) {
      activeGroup = updatedGroup;
    }
  };

  const resetOnSessionExpired = () => {
    groups = [];
    activeGroup = null;
    error = null;
  };

  return {
    getState: () => ({ groups, activeGroup, loading, error }),
    setActiveGroup: (g) => {
      activeGroup = g;
    },
    fetchGroups,
    createNewGroup,
    deleteGroup,
    leaveGroup,
    updateGroup,
    resetOnSessionExpired,
  };
}

test('GroupState - fetchGroups and active group selection', async (t) => {
  await t.test('automatically selects first group on initial load when none active', async () => {
    const state = createGroupState();
    await state.fetchGroups();

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(groups.length, 2);
    assert.strictEqual(activeGroup.id, 1);
    assert.strictEqual(activeGroup.name, 'Algorithms Study Group');
  });

  await t.test('selects explicit target group when selectGroupId is provided', async () => {
    const state = createGroupState();
    await state.fetchGroups(2);

    const { activeGroup } = state.getState();
    assert.strictEqual(activeGroup.id, 2);
    assert.strictEqual(activeGroup.name, 'Physics Club');
  });

  await t.test('preserves existing activeGroup when refreshed if still in group list', async () => {
    const state = createGroupState();
    await state.fetchGroups(2);

    // Refresh with updated data
    await state.fetchGroups(null, async () => [
      { id: 1, name: 'Algorithms Study Group' },
      { id: 2, name: 'Physics Club (Updated)' },
      { id: 3, name: 'Chemistry' },
    ]);

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(groups.length, 3);
    assert.strictEqual(activeGroup.id, 2);
    assert.strictEqual(activeGroup.name, 'Physics Club (Updated)');
  });

  await t.test('handles empty group list by setting activeGroup to null', async () => {
    const state = createGroupState();
    await state.fetchGroups(null, async () => []);

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(groups.length, 0);
    assert.strictEqual(activeGroup, null);
  });
});

test('GroupState - creation, deletion, leaving, and updating', async (t) => {
  await t.test('createNewGroup adds new group and sets it as active', async () => {
    const state = createGroupState();
    await state.fetchGroups();

    const created = await state.createNewGroup(
      { name: 'Data Science' },
      async (data) => ({ id: 3, ...data })
    );

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(created.id, 3);
    assert.strictEqual(groups.length, 3);
    assert.strictEqual(activeGroup.id, 3);
    assert.strictEqual(activeGroup.name, 'Data Science');
  });

  await t.test('deleteGroup removes group and switches activeGroup to remaining group', async () => {
    const state = createGroupState();
    await state.fetchGroups();
    assert.strictEqual(state.getState().activeGroup.id, 1);

    await state.deleteGroup(1, async () => true);

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(groups.length, 1);
    assert.strictEqual(activeGroup.id, 2);
    assert.strictEqual(activeGroup.name, 'Physics Club');
  });

  await t.test('deleteGroup sets activeGroup to null when last group is deleted', async () => {
    const state = createGroupState();
    await state.fetchGroups(null, async () => [{ id: 10, name: 'Solo Group' }]);
    assert.strictEqual(state.getState().activeGroup.id, 10);

    await state.deleteGroup(10, async () => true);

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(groups.length, 0);
    assert.strictEqual(activeGroup, null);
  });

  await t.test('leaveGroup removes group and switches active selection', async () => {
    const state = createGroupState();
    await state.fetchGroups();
    assert.strictEqual(state.getState().activeGroup.id, 1);

    state.leaveGroup(1);

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(groups.length, 1);
    assert.strictEqual(activeGroup.id, 2);
  });

  await t.test('updateGroup modifies group details in place and updates active reference', async () => {
    const state = createGroupState();
    await state.fetchGroups();

    state.updateGroup({ id: 1, name: 'Advanced Algorithms', description: 'Updated' });

    const { groups, activeGroup } = state.getState();
    const updated = groups.find((g) => g.id === 1);
    assert.strictEqual(updated.name, 'Advanced Algorithms');
    assert.strictEqual(activeGroup.name, 'Advanced Algorithms');
  });

  await t.test('session expired resets group state completely', async () => {
    const state = createGroupState();
    await state.fetchGroups();
    assert.strictEqual(state.getState().groups.length, 2);

    state.resetOnSessionExpired();

    const { groups, activeGroup } = state.getState();
    assert.strictEqual(groups.length, 0);
    assert.strictEqual(activeGroup, null);
  });
});
