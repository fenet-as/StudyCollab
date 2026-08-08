// src/components/common/EmptyState/EmptyState.jsx
import React from "react";
import { Plus, LogIn } from "lucide-react";
import styles from "./EmptyState.module.css";

export default function EmptyState({ onCreateGroup, onJoinGroup }) {
  return (
    <div className={styles.container}>
      <h2>No Workspaces</h2>
      <p>Select an option below to get started.</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onCreateGroup}
        >
          <Plus size={16} />
          <span>Create Group</span>
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onJoinGroup}
        >
          <LogIn size={16} />
          <span>Join Group</span>
        </button>
      </div>
    </div>
  );
}