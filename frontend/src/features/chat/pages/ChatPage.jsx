import React from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import styles from "./ChatPage.module.css";

/**
 * ChatPage - Entry point component for the Chat workspace tab.
 *
 * Current Status: Planned / In-Development Prototype.
 * Interactive chat prototype components are maintained in `../components/`
 * and will be activated once backend WebSocket services are implemented.
 * See `features/chat/README.md` for full component inventory and roadmap.
 */
export default function ChatPage() {
  return (
    <div
      className={styles.container}
      role="region"
      aria-label="Chat feature placeholder"
    >
      <div className={styles.placeholderCard}>
        <div className={styles.iconBadge}>
          <MessageSquare size={32} strokeWidth={1.75} />
        </div>
        <h3 className={styles.title}>
          Chat Feature Space
        </h3>
        <p className={styles.description}>
          Coming soon to the StudyCollab workspace. Real-time messaging, topic channels, and study discussions are currently in development.
        </p>
        <div className={styles.badge}>
          <Sparkles size={13} />
          <span>In Development</span>
        </div>
      </div>
    </div>
  );
}
