// frontend/src/features/notes/hooks/useNotes.js
import { useState, useEffect, useCallback } from 'react';
import { notesApi } from '../../../api/notesApi';

export function useNotes(groupId) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to extract clean error message from Spring response
  const extractErrorMessage = (err, fallbackMessage) => {
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    // If validation returns a map of field errors { title: "Title cannot exceed...", content: "..." }
    if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
      return Object.values(err.response.data.errors).join(', ');
    }
    return fallbackMessage;
  };

  const fetchNotes = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await notesApi.getByGroup(groupId);
      setNotes(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch notes.'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const createNote = async (noteData) => {
    try {
      const payload = { ...noteData, groupId };
      const newNote = await notesApi.create(payload);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to create note.'));
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      const payload = { ...noteData, groupId };
      const updated = await notesApi.update(id, payload);
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
      return updated;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to update note.'));
    }
  };

  const deleteNote = async (id) => {
    try {
      await notesApi.delete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to delete note.'));
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    refreshNotes: fetchNotes,
    createNote,
    updateNote,
    deleteNote
  };
}