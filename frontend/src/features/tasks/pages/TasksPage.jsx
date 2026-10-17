// frontend/src/features/tasks/pages/TasksPage.jsx
import React, { useState } from 'react';
import styles from './TasksPage.module.css';
import AddTaskModal from '../../../components/interactive/AddTaskModal/AddTaskModal';
import { useTasks } from '../hooks/useTasks';
import { useGroupsContext } from '../../../context/useGroupsContext';

export default function TasksPage({ group }) {
  const { groups, activeGroup: contextGroup, selectedGroup, loading: groupsLoading } = useGroupsContext();

  // Prioritize group passed as prop from Dashboard, falling back to context or first group
  const currentGroup = group || contextGroup || selectedGroup || (groups && groups.length > 0 ? groups[0] : null);
  const groupId = currentGroup ? currentGroup.id : null;

  const formatDueDate = (date) => {
    if (!date) return 'No Due Date';

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Grab tasks AND normalized members for the active groupId
  const { tasks = [], members = [], loading: tasksLoading, error, createTask, updateTask, deleteTask } = useTasks(groupId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getCurrentUserId = () => {
    const savedId = localStorage.getItem('userId');
    return savedId ? Number(savedId) : null;
  };

  const getCreatorName = (task) => {
    const backendName = task.creatorName || task.createdByName || task.assignedByName;
    if (backendName) return backendName;

    const creatorId = task.creatorId || task.createdById || task.createdBy;
    if (!creatorId) return 'Group Admin';

    const creator = members.find(
      (m) => (m.userId || m.id)?.toString() === creatorId.toString()
    );

    return creator ? creator.fullName : 'Group Admin';
  };

  const getAssigneeName = (task) => {
    if (task.assigneeName) return task.assigneeName;
    const assigneeId = task.assigneeId || task.assignee;
    if (!assigneeId) return 'Unassigned';

    const assignee = members.find(
      (m) => (m.userId || m.id)?.toString() === assigneeId.toString()
    );

    return assignee ? assignee.fullName : 'Unassigned';
  };

  const handleSaveOrAddTask = async (newTaskData) => {
    const currentUserId = getCurrentUserId();
    const resolvedCreatorId = newTaskData.creatorId || currentUserId;

    const payload = {
      title: newTaskData.title,
      description: newTaskData.description,
      priority: newTaskData.priority,
      dueDate: newTaskData.dueDate || null,
      assigneeId: newTaskData.assigneeId ? Number(newTaskData.assigneeId) : null,
      groupId: groupId ? Number(groupId) : null,
      creatorId: resolvedCreatorId ? Number(resolvedCreatorId) : null
    };

    try {
      if (newTaskData.id) {
        payload.creatorId = newTaskData.creatorId || currentUserId;
        await updateTask(newTaskData.id, payload);
      } else {
        payload.status = 'TODO';
        await createTask(payload);
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error("Error saving task downstream:", err);
    }
  };

  const handleCardClick = (task) => {
    const normalizedTask = {
      ...task,
      description: task.description || task.desc || '',
      dueDate: task.dueDate || task.due || ''
    };
    setEditingTask(normalizedTask);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteTask(id);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const moveTask = async (e, id, targetStatus) => {
    e.stopPropagation();
    try {
      await updateTask(id, { status: targetStatus });
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const getInitials = (name) => {
    if (!name || name === 'Unassigned') return '?';
    return name.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Filter tasks to safety-check group matching and apply search query
  const groupTasks = tasks.filter(t => !t.groupId || Number(t.groupId) === Number(groupId));
  const filteredTasks = groupTasks.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  if (groupsLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your study groups...</div>;
  }

  if (!groupId) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h3>No active group found</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Please create or join a study group first to start viewing or tracking tasks!
        </p>
      </div>
    );
  }

  if (tasksLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading board tasks...</div>;
  }

  return (
    <div className={styles.tasksContainer}>
      {error && (
        <div style={{ color: 'var(--danger-text)', padding: '1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', marginBottom: '1rem' }}>
          <strong>Error syncing with server:</strong> {error}
        </div>
      )}

      <div className={styles.topToolbar}>
        <div className={styles.searchWrapper}>
          <div className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className={styles.taskSearchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className={styles.addTaskBtn} onClick={() => { setEditingTask(null); setIsModalOpen(true); }}>
          <span className={styles.btnPlus}>+</span> Add Task
        </button>
      </div>

      <div className={styles.kanbanBoard}>
        {/* Column 1: TODO */}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <div className={styles.titleGroup}>
              <span className={styles.todoDot}>●</span>
              <h3>TODO</h3>
              <span className={styles.taskCountBadge}>{todoTasks.length}</span>
            </div>
          </div>
          <div className={styles.columnBody}>
            {todoTasks.length === 0 ? (
              <div className={styles.emptyColumnState}>No tasks left to do!</div>
            ) : (
              todoTasks.map(task => {
                const assignedBy = getCreatorName(task);
                const assignedTo = getAssigneeName(task);
                const descriptionText = task.description || task.desc || '';
                const taskDueDate = formatDueDate(task.dueDate || task.due);

                return (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Task: ${task.title}. Priority ${task.priority || 'medium'}. Press Enter to edit.`}
                    className={styles.taskCard}
                    onClick={() => handleCardClick(task)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleCardClick(task);
                      }
                    }}
                  >
                    <div className={styles.cardTopRow}>
                      <span className={`${styles.prioBadge} ${styles[task.priority?.toLowerCase()]}`}>{task.priority}</span>
                      <div className={styles.cardActions}>
                        <button onClick={(e) => moveTask(e, task.id, 'DONE')} title="Mark complete" aria-label="Mark task complete" className={styles.actionIconButton}>✓</button>
                        <button onClick={(e) => handleDeleteTask(e, task.id)} title="Delete" aria-label="Delete task" className={styles.actionIconButton}>✕</button>
                      </div>
                    </div>

                    <h4 className={styles.taskCardTitle}>{task.title}</h4>
                    {descriptionText && <p className={styles.taskCardDesc}>{descriptionText}</p>}

                    <div className={styles.assignmentMetaContainer}>
                      <div className={styles.assignmentItem}>
                        <span className={styles.metaLabel}>Assigned by</span>
                        <div className={styles.userChip}>
                          <span className={styles.userAvatarSm}>{getInitials(assignedBy)}</span>
                          <span className={styles.userName} title={assignedBy}>{assignedBy}</span>
                        </div>
                      </div>

                      <div className={styles.metaDivider} />

                      <div className={styles.assignmentItem}>
                        <span className={styles.metaLabel}>Assigned to</span>
                        <div className={styles.userChip}>
                          <span className={`${styles.userAvatarSm} ${styles.assigneeAvatar}`}>
                            {getInitials(assignedTo)}
                          </span>
                          <span className={styles.userName} title={assignedTo}>{assignedTo}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardBottomRow}>
                      <div className={styles.dueDateBadge}>
                        <span className={styles.clockIcon} />
                        {taskDueDate}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: DONE */}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <div className={styles.titleGroup}>
              <span className={styles.doneDot}>●</span>
              <h3>DONE</h3>
              <span className={styles.taskCountBadge}>{doneTasks.length}</span>
            </div>
          </div>
          <div className={styles.columnBody}>
            {doneTasks.length === 0 ? (
              <div className={styles.emptyColumnState}>No completed items yet.</div>
            ) : (
              doneTasks.map(task => {
                const assignedBy = getCreatorName(task);
                const assignedTo = getAssigneeName(task);
                const descriptionText = task.description || task.desc || '';

                return (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Completed task: ${task.title}. Press Enter to edit.`}
                    className={`${styles.taskCard} ${styles.completedTaskCard}`}
                    onClick={() => handleCardClick(task)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleCardClick(task);
                      }
                    }}
                  >
                    <div className={styles.cardTopRow}>
                      <span className={`${styles.prioBadge} ${styles.donePrio}`}>DONE</span>
                      <div className={styles.cardActions}>
                        <button onClick={(e) => moveTask(e, task.id, 'TODO')} title="Revert back to Todo" aria-label="Revert task back to Todo" className={styles.actionIconButton}>↺</button>
                        <button onClick={(e) => handleDeleteTask(e, task.id)} title="Delete" aria-label="Delete task" className={styles.actionIconButton}>✕</button>
                      </div>
                    </div>

                    <h4 className={styles.taskCardTitle}>{task.title}</h4>
                    {descriptionText && <p className={styles.taskCardDesc}>{descriptionText}</p>}

                    <div className={styles.assignmentMetaContainer}>
                      <div className={styles.assignmentItem}>
                        <span className={styles.metaLabel}>Assigned by</span>
                        <div className={styles.userChip}>
                          <span className={styles.userAvatarSm}>{getInitials(assignedBy)}</span>
                          <span className={styles.userName} title={assignedBy}>{assignedBy}</span>
                        </div>
                      </div>

                      <div className={styles.metaDivider} />

                      <div className={styles.assignmentItem}>
                        <span className={styles.metaLabel}>Assigned to</span>
                        <div className={styles.userChip}>
                          <span className={`${styles.userAvatarSm} ${styles.assigneeAvatar}`}>
                            {getInitials(assignedTo)}
                          </span>
                          <span className={styles.userName} title={assignedTo}>{assignedTo}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardBottomRow}>
                      <div className={styles.dueDateBadge}>
                        Completed
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddTaskModal 
          onClose={() => { setIsModalOpen(false); setEditingTask(null); }} 
          onSubmit={handleSaveOrAddTask} 
          groupMembers={members} 
          taskToEdit={editingTask}
        />
      )}
    </div>
  );
}