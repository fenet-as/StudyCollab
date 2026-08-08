import React, { useState } from "react";
import { UserPlus, X, KeyRound } from "lucide-react";
import { groupApi } from "../../../api/groupApi"; // Adjust relative import path as needed
import styles from "./JoinGroupModal.module.css";

export default function JoinGroupModal({ onClose, onJoinSuccess }) {
  const [inviteInput, setInviteInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    setError(null);
    setLoading(true);

    // Sanitize input if user pasted a full URL
    let code = inviteInput.trim();
    if (code.includes("/join/")) {
      code = code.split("/join/").pop();
    }

    // Inside JoinGroupModal.jsx -> handleSubmit

try {
  const joinedGroup = await groupApi.joinGroupByInviteCode(code);

  // Use optional chaining or an if-check
  if (typeof onJoinSuccess === "function") {
    onJoinSuccess(joinedGroup);
  }

  onClose();
} catch (err) {
  setError(err.message || "Invalid or expired invite code. Please try again.");
} finally {
  setLoading(false);
}

  };






  

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <UserPlus size={20} />
            </div>
            <h3>Join a Study Group</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p className={styles.description}>
            Enter an invite code or full invite URL provided by your teammate or admin.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="inviteCode">Invite Code or Link</label>
            <div className={styles.inputWrapper}>
              <KeyRound className={styles.inputIcon} size={18} />
              <input
                id="inviteCode"
                type="text"
                placeholder="e.g. ABC12345 or https://..."
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !inviteInput.trim()}
            >
              {loading ? "Joining..." : "Join Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}