import React, { useState, useEffect } from "react";
import { X, Users, AlertCircle, Loader2 } from "lucide-react";
import { groupApi } from "../../../api/groupApi.js";
import {
  formatMemberRole,
  getMemberInitials,
} from "../../utils/chatValidation.js";
import styles from "./MemberList.module.css";

function getRoleBadgeClass(role) {
  if (!role) return styles.roleMember;
  const upper = String(role).toUpperCase();
  if (upper === "CREATOR" || upper === "OWNER") return styles.roleCreator;
  if (upper === "ADMIN") return styles.roleAdmin;
  return styles.roleMember;
}

export default function MemberList({
  groupId,
  members: propMembers,
  currentUserId,
  isOpen = true,
  onClose,
}) {
  const [fetchedMembers, setFetchedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If propMembers is supplied, use it; otherwise fetch using groupId
  useEffect(() => {
    if (propMembers !== undefined && propMembers !== null) {
      setFetchedMembers(propMembers);
      return;
    }

    if (!groupId) {
      setFetchedMembers([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchMembers = async () => {
      try {
        const fetchFn = groupApi.getGroupMembers || groupApi.getGroupMembersSummary;
        const data = await fetchFn(groupId);
        if (isMounted) {
          setFetchedMembers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch group members:", err);
          setError("Failed to load members");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [groupId, propMembers]);

  const members =
    propMembers !== undefined && propMembers !== null
      ? propMembers
      : fetchedMembers;

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && onClose && (
        <div
          className={styles.mobileBackdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.membersSidebar} ${
          isOpen ? styles.drawerOpen : ""
        }`}
        aria-label="Workspace members sidebar"
      >
        <div className={styles.sidebarHeader}>
          <h4>
            Workspace Members{" "}
            {members.length > 0 && <span>({members.length})</span>}
          </h4>
          {onClose && (
            <button
              type="button"
              className={styles.closeDrawerBtn}
              onClick={onClose}
              aria-label="Close members pane"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <Loader2 size={20} className={styles.spinner} />
            <span>Loading members...</span>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <AlertCircle size={18} className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        ) : members.length === 0 ? (
          <div className={styles.emptyContainer}>
            <Users size={24} className={styles.emptyIcon} />
            <span>No members found</span>
          </div>
        ) : (
          <div className={styles.memberList}>
            {members.map((member) => {
              const memberId = member.id || member.userId;
              const isCurrentUser =
                member.isCurrentUser ||
                (currentUserId && String(memberId) === String(currentUserId));
              const displayName =
                member.name || member.fullName || member.email || "Member";
              const initials = getMemberInitials(
                member.name || member.fullName,
                member.email
              );
              const avatar = member.avatarUrl || member.avatar;
              const roleTitle = formatMemberRole(member.role);
              const roleClass = getRoleBadgeClass(member.role);

              return (
                <div
                  key={memberId || member.email}
                  className={styles.memberCard}
                  data-testid="member-card"
                >
                  <div
                    className={`${styles.memberAvatar} ${
                      member.status === "offline" ? styles.offline : styles.online
                    }`}
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName} title={displayName}>
                      {displayName}
                      {isCurrentUser && (
                        <span className={styles.youIndicator}> (You)</span>
                      )}
                    </span>
                    <span className={`${styles.memberRole} ${roleClass}`}>
                      {roleTitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
}
