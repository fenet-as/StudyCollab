import React, { useState } from "react";
import styles from "./ContentHeader.module.css";

export default function MemberAvatar({ member }) {
  const [imgError, setImgError] = useState(false);

  const name = member?.fullName || member?.name || "Member";
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={styles.stackedAvatar}
      title={`${name} (${member?.role || "Member"})`}
    >
      {member?.avatarUrl && !imgError ? (
        <img
          src={member.avatarUrl}
          alt={name}
          className={styles.avatarImage}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={styles.avatarInitial}>{initial}</span>
      )}
    </div>
  );
}