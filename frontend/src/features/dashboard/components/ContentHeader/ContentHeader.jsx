import React from "react";
import styles from "./ContentHeader.module.css";
import MemberAvatar from "./MemberAvatar";

export default function ContentHeader({ activeGroup, setActiveTab }) {
  if (!activeGroup) return null;

  const members = activeGroup.members || [];
  const visibleMembers = members.slice(0, 4);
  const remainingCount = members.length - 4;

  return (
    <header className={styles.contentHeader}>
      <div className={styles.headerLeft}>
        <h2>{activeGroup.name}</h2>
      </div>

      <div className={styles.headerRight}>
        <div
          className={styles.avatarGroup}
          onClick={() => setActiveTab && setActiveTab("Group Settings")}
          title="Manage Group Members in Group Settings"
        >
          {visibleMembers.map((member, index) => (
            <MemberAvatar
              key={member.id || member.userId || index}
              member={member}
            />
          ))}

          {remainingCount > 0 && (
            <div className={`${styles.stackedAvatar} ${styles.overflowAvatar}`}>
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}