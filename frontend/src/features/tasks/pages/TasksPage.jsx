// frontend/src/features/tasks/pages/TasksPage.jsx
import React, { useState } from 'react';
import styles from './TasksPage.module.css';
import AddTaskModal from '../../../components/interactive/AddTaskModal/AddTaskModal';
import { useTasks } from '../hooks/useTasks';
import { useGroupsContext } from '../../../context/GroupContext'; 

export default function TasksPage() {
  const { groups, loading: groupsLoading } = useGroupsContext();
  const groupId = groups && groups.length > 0 ? groups[0].id : null; 

  // Grab tasks AND our dynamically fetched real members list
  const { tasks, members, loading: tasksLoading, error, createTask, updateTask, deleteTask } = useTasks(groupId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cleaned Helper: Retrieve current user's database ID directly from localStorage
  const getCurrentUserId = () => {
    const savedId = localStorage.getItem('userId');
    return savedId ? Number(savedId) : null;
  };

  // Resolves the assigner's name from the fetched members list
  const getCreatorName = (task) => {
    // If the backend already includes a pre-joined name field, use it first
    const backendName = task.creatorName || task.createdByName || task.assignedByName;
    if (backendName) return backendName;

    // Otherwise, match the task's creatorId/createdById against our members list
    const creatorId = task.creatorId || task.createdById || task.createdBy;
    if (!creatorId) return 'Group Admin';

    const creator = members.find(
      (m) => (m.userId || m.id).toString() === creatorId.toString()
    );

    return creator ? creator.fullName : 'Group Admin';
  };

 const handleSaveOrAddTask = async (newTaskData) => {
    const currentUserId = getCurrentUserId();

    // Prioritize the validated creatorId returned by the Modal component itself
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

    console.group('🚀 [Task Debug] Task Payload Assembly');
    console.log('Incoming Modal Data:', newTaskData);
    console.log('Detected Current User ID:', currentUserId);
    console.log('Resolved Creator ID:', resolvedCreatorId);
    console.log('Dispatched Payload:', payload);
    console.groupEnd();

    try {
      if (newTaskData.id) {
        // EDIT MODE: Preserve original creator ID if updating an existing task
        const originalCreatorId = newTaskData.creatorId || currentUserId;
        payload.creatorId = originalCreatorId ? Number(originalCreatorId) : null;
        
        await updateTask(newTaskData.id, payload);
      } else {
        // CREATE MODE: Assign task state properties
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
    if (!name) return '??';
    return name.split(' ').map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const filteredTasks = tasks.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  if (groupsLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your study groups...</div>;
  }

  if (!groupId) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h3>No active group found</h3>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>
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
        <div style={{ color: 'red', padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem' }}>
          <strong>Error syncing with server:</strong> {error}
        </div>
      )}

      <div className={styles.topToolbar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}></span>
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
                const descriptionText = task.description || task.desc || '';
                const taskDueDate = task.dueDate || task.due || 'No Due Date';

                return (
                  <div key={task.id} className={styles.taskCard} onClick={() => handleCardClick(task)} style={{ cursor: 'pointer' }}>
                    <div className={styles.cardTopRow}>
                      <span className={`${styles.prioBadge} ${styles[task.priority.toLowerCase()]}`}>{task.priority}</span>
                      <div className={styles.cardActions}>
                        <button onClick={(e) => moveTask(e, task.id, 'DONE')} title="Mark complete" className={styles.actionIconButton}>✓</button>
                        <button onClick={(e) => handleDeleteTask(e, task.id)} title="Delete" className={styles.actionIconButton}>✕</button>
                      </div>
                    </div>
                    <h4 className={styles.taskCardTitle}>{task.title}</h4>
                    <p className={styles.taskCardDesc}>{descriptionText}</p>
                    
                    <div className={styles.assignedByRow}>
                      <span className={styles.assignedByLabel}>Assigned by:</span> <strong>{assignedBy}</strong>
                    </div>

                    <div className={styles.cardBottomRow}>
                      <div className={styles.dueDateBadge}>
                        <span className={styles.clockIcon}></span> {taskDueDate}
                      </div>
                      <div className={styles.assignedUserAvatar} title={`Assigned to: ${task.assigneeName || 'Unassigned'}`}>
                        {getInitials(task.assigneeName)}
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
                const descriptionText = task.description || task.desc || '';

                return (
                  <div key={task.id} className={`${styles.taskCard} ${styles.completedTaskCard}`} onClick={() => handleCardClick(task)} style={{ cursor: 'pointer' }}>
                    <div className={styles.cardTopRow}>
                      <span className={`${styles.prioBadge} ${styles.donePrio}`}>DONE</span>
                      <div className={styles.cardActions}>
                        <button onClick={(e) => moveTask(e, task.id, 'TODO')} title="Revert back to Todo" className={styles.actionIconButton}>↺</button>
                        <button onClick={(e) => handleDeleteTask(e, task.id)} title="Delete" className={styles.actionIconButton}>✕</button>
                      </div>
                    </div>
                    <h4 className={styles.taskCardTitle}>{task.title}</h4>
                    <p className={styles.taskCardDesc}>{descriptionText}</p>

                    <div className={styles.assignedByRow}>
                      <span className={styles.assignedByLabel}>Assigned by:</span> <strong>{assignedBy}</strong>
                    </div>

                    <div className={styles.cardBottomRow}>
                      <div className={styles.dueDateBadge}>Complete</div>
                      <div className={styles.assignedUserAvatar} title={`Assigned to: ${task.assigneeName || 'Unassigned'}`}>
                        {getInitials(task.assigneeName)}
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