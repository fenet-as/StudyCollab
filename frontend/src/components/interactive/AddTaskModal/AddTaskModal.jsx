// frontend/src/components/interactive/AddTaskModal/AddTaskModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Check } from 'lucide-react';
import styles from './AddTaskModal.module.css';

export default function AddTaskModal({ onClose, onSubmit, groupMembers = [], taskToEdit = null }) {
  // Cleaned Helper: Retrieve current user's database ID directly from localStorage as a Number
  const getCurrentUserId = () => {
    const savedId = localStorage.getItem('userId');
    return savedId ? Number(savedId) : null;
  };

  // Get today's date formatted as YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '' 
  });

  // Hydrate form on mount or when taskToEdit/groupMembers change
  useEffect(() => {
    if (taskToEdit) {
      const matchedMember = groupMembers.find(
        m => Number(m.userId || m.id) === Number(taskToEdit.assigneeId) || m.fullName === taskToEdit.assigneeName
      );
      
      setFormData({
        title: taskToEdit.title || '',
        description: taskToEdit.description || taskToEdit.desc || '',
        priority: taskToEdit.priority || 'MEDIUM',
        dueDate: taskToEdit.dueDate || taskToEdit.due || '',
        assigneeId: matchedMember ? Number(matchedMember.userId || matchedMember.id) : (getCurrentUserId() || '')
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeId: getCurrentUserId() || '' // Default to current user's numeric ID
      });
    }
  }, [taskToEdit, groupMembers]);

  // SAFE VALIDATION: Ensure comparison compares numeric values to avoid string/number mismatch bugs
  useEffect(() => {
    if (groupMembers.length > 0 && formData.assigneeId) {
      const isValid = groupMembers.some(
        (m) => Number(m.userId || m.id) === Number(formData.assigneeId)
      );
      if (!isValid) {
        const firstMember = groupMembers[0];
        const fallbackId = Number(firstMember.userId || firstMember.id);
        setFormData((prev) => ({ ...prev, assigneeId: fallbackId }));
      }
    } else if (groupMembers.length > 0 && !formData.assigneeId) {
      const defaultId = getCurrentUserId() || Number(groupMembers[0].userId || groupMembers[0].id);
      setFormData((prev) => ({ ...prev, assigneeId: defaultId }));
    }
  }, [groupMembers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Use current user as ultimate fallback for assignee
    const finalAssigneeId = formData.assigneeId ? Number(formData.assigneeId) : getCurrentUserId();

    const selectedMember = groupMembers.find(
      (m) => Number(m.userId || m.id) === Number(finalAssigneeId)
    );

    // Grab creator ID cleanly from the existing task, or fallback to the direct localStorage id as a number
    const rawCreatorId = taskToEdit 
      ? (taskToEdit.creatorId || taskToEdit.createdById || taskToEdit.createdBy) 
      : getCurrentUserId();
    
    const finalCreatorId = rawCreatorId ? Number(rawCreatorId) : null;

    onSubmit({
      ...formData,
      assigneeId: finalAssigneeId,
      creatorId: finalCreatorId, 
      id: taskToEdit ? taskToEdit.id : null,
      assignedMember: selectedMember || null
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{taskToEdit ? 'Edit Task Details' : 'Create New Task'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Task Title</label>
            <input 
              type="text" 
              id="title"
              placeholder="e.g., Finish ER Diagram"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea 
              id="description"
              rows="3"
              placeholder="Provide context regarding requirements..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="assigneeId">Assign Member</label>
            <select
              id="assigneeId"
              value={formData.assigneeId}
              onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
              required
            >
              {groupMembers.length === 0 ? (
                <option value="">Loading members...</option>
              ) : (
                groupMembers.map((member) => {
                  const memberId = Number(member.userId || member.id);
                  return (
                    <option key={memberId} value={memberId}>
                      {member.fullName || 'Registered Student'} ({member.email})
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="priority">Priority</label>
              <select 
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dueDate">Due Date</label>
              <input 
                type="date" 
                id="dueDate"
                className={styles.datePickerInput}
                min={getTodayString()}
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.createBtn} disabled={groupMembers.length === 0}>
              {taskToEdit ? (
                <>
                  <Check size={18} />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}