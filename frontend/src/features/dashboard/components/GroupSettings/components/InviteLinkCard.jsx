// InviteLinkCard.jsx
import React, { useState } from 'react';
import styles from './InviteLinkCard.module.css';

export default function InviteLinkCard({ 
  groupId, 
  inviteCode, 
  onRegenerate, 
  canManage = true // Set to false if non-admin users shouldn't see/use the regenerate button
}) {
  const [currentInviteCode, setCurrentInviteCode] = useState(inviteCode);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync prop changes to state if needed
  React.useEffect(() => {
    setCurrentInviteCode(inviteCode);
  }, [inviteCode]);

  const handleCopy = () => {
    if (!currentInviteCode) return;
    navigator.clipboard.writeText(currentInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!groupId || isRegenerating) return;

    const confirmRegenerate = window.confirm(
      "Are you sure you want to regenerate the invite link? The old link will immediately stop working."
    );
    if (!confirmRegenerate) return;

    setIsRegenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/groups/${groupId}/invite-code/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ensure your auth header is included here if needed by your API client layer
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate invite link.');
      }

      const data = await response.json(); 
      // Expected backend response DTO format: { inviteCode: "..." } or { inviteLink: "..." }
      const newCode = data.inviteCode || data.inviteLink || data;

      setCurrentInviteCode(newCode);

      // Notify parent component if callback provided
      if (onRegenerate) {
        onRegenerate(newCode);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error regenerating link');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconBox}>
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </div>
        <div className={styles.headerTextWrapper}>
          <h3>Invite Link</h3>
          <p className={styles.subtitle}>Share this private join link with your classmates.</p>
        </div>
      </div>

      <div className={styles.linkContainer}>
        <div className={styles.linkBox}>
          <input
            type="text"
            readOnly
            value={currentInviteCode || 'No active invite code'}
            className={styles.input}
            onClick={(e) => e.target.select()}
          />

          <div className={styles.actionButtonGroup}>
            <button
              type="button"
              onClick={handleCopy}
              className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
              disabled={!currentInviteCode || isRegenerating}
            >
              {copied ? (
                <>
                  <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.375a9 9 0 00-9-9" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>

            {canManage && (
              <button
                type="button"
                onClick={handleRegenerate}
                className={styles.regenerateBtn}
                disabled={isRegenerating}
                title="Invalidate old link and create a new one"
              >
                <svg 
                  className={`${styles.btnIcon} ${isRegenerating ? styles.spinning : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {isRegenerating ? 'Resetting...' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

        <p className={styles.warning}>
          Caution: Anyone with this link can join directly. Regenerating will revoke access for the old link.
        </p>
      </div>
    </div>
  );
}