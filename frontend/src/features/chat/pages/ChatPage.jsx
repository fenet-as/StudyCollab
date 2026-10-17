import React from "react";
import { MessageSquare } from "lucide-react";

/**
 * ChatPage - Entry point component for the Chat workspace tab.
 *
 * Current Status: Placeholder / Planned Feature.
 * Interactive chat prototype components are maintained in `../components/`
 * and will be activated once backend WebSocket services are implemented.
 * See `features/chat/README.md` for full component inventory and roadmap.
 */
export default function ChatPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
      role="region"
      aria-label="Chat feature placeholder"
    >
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageSquare size={48} strokeWidth={1.5} color="#94a3b8" />
      </div>
      <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>
        Chat Feature Space
      </h3>
      <p style={{ margin: 0, color: "var(--text-secondary)" }}>
        Coming soon to the StudyCollab workspace.
      </p>
    </div>
  );
}
