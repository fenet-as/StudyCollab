import React, { useState } from 'react';
import styles from './TasksPage.module.css';
import AddTaskModal from '../../../components/interactive/AddTaskModal/AddTaskModal';

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Kanban items state initialization matching specifications
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Finish ER Diagram', desc: 'Map out the complete normalization steps up to 3NF.', status: 'TODO', priority: 'HIGH', due: 'Tomorrow', initial: 'JD' },
    { id: '2', title: 'Write SQL Seed Scripts', desc: 'Create tables, constraints and initial user insertions.', status: 'TODO', priority: 'MEDIUM', due: 'In 3 days', initial: 'AM' },
    { id: '3', title: 'Setup Spring Boot Structure', desc: 'Initialize standard repository and folder layers configuration.', status: 'DONE', priority: 'HIGH', due: 'Completed', initial: 'JD' },
  ]);

  const handleAddTask = (newTaskData) => {
    const freshTask = {
      id: Date.now().toString(),
      title: newTaskData.title,
      desc: newTaskData.description,
      status: 'TODO',
      priority: newTaskData.priority,
      due: newTaskData.dueDate || 'No Due Date',
      initial: 'ME'
    };
    setTasks([...tasks, freshTask]);
    setIsModalOpen(false);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const moveTask = (id, targetStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: targetStatus } : t));
  };

  const todoTasks = tasks.filter(t => t.status === 'TODO' && t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const doneTasks = tasks.filter(t => t.status === 'DONE' && t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={styles.tasksContainer}>
      {/* Top action dashboard items */}
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
        <button className={styles.addTaskBtn} onClick={() => setIsModalOpen(true)}>
          <span className={styles.btnPlus}>+</span> Add Task
        </button>
      </div>

      {/* Board Columns container structural flex layout */}
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
              todoTasks.map(task => (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.cardTopRow}>
                    <span className={`${styles.prioBadge} ${styles[task.priority.toLowerCase()]}`}>{task.priority}</span>
                    <div className={styles.cardActions}>
                      <button onClick={() => moveTask(task.id, 'DONE')} title="Mark complete" className={styles.actionIconButton}>✓</button>
                      <button onClick={() => handleDeleteTask(task.id)} title="Delete" className={styles.actionIconButton}>✕</button>
                    </div>
                  </div>
                  <h4 className={styles.taskCardTitle}>{task.title}</h4>
                  <p className={styles.taskCardDesc}>{task.desc}</p>
                  <div className={styles.cardBottomRow}>
                    <div className={styles.dueDateBadge}>
                      <span className={styles.clockIcon}></span> {task.due}
                    </div>
                    <div className={styles.assignedUserAvatar}>{task.initial}</div>
                  </div>
                </div>
              ))
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
              doneTasks.map(task => (
                <div key={task.id} className={`${styles.taskCard} ${styles.completedTaskCard}`}>
                  <div className={styles.cardTopRow}>
                    <span className={`${styles.prioBadge} ${styles.donePrio}`}>DONE</span>
                    <div className={styles.cardActions}>
                      <button onClick={() => moveTask(task.id, 'TODO')} title="Revert back to Todo" className={styles.actionIconButton}>↺</button>
                      <button onClick={() => handleDeleteTask(task.id)} title="Delete" className={styles.actionIconButton}>✕</button>
                    </div>
                  </div>
                  <h4 className={styles.taskCardTitle}>{task.title}</h4>
                  <p className={styles.taskCardDesc}>{task.desc}</p>
                  <div className={styles.cardBottomRow}>
                    <div className={styles.dueDateBadge}>Complete</div>
                    <div className={styles.assignedUserAvatar}>{task.initial}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddTaskModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddTask} 
        />
      )}
    </div>
  );
}