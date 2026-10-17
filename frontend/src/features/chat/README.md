# Chat Feature Module

## 1. Overview & Current Status

The **Chat** module provides a modern, collaborative group messaging interface for StudyCollab study groups. 

> **Current Status: Planned / In-Development Prototype**
> The UI components located in `src/features/chat/components/` constitute a complete frontend prototype (channels, message feed, reactions, rich message drafting, and member drawer). However, because the backend currently does not provide real-time WebSocket or chat persistence services, these components are **deliberately isolated** from production user workflows to prevent misleading or broken interactions.
>
> In the main workspace dashboard (`src/features/dashboard/pages/Dashboard.jsx`), selecting the **Chat** tab displays a clear placeholder (`<ChatPage />`) stating that real-time chat is coming soon.

---

## 2. Component Inventory

The following table details all chat components, their roles, current status, and usage:

| Component | File Path | Status | Role & Features |
| :--- | :--- | :--- | :--- |
| **`ChatPage`** | `src/features/chat/pages/ChatPage.jsx` | **Active / Placeholder** | Top-level entry point mounted by `Dashboard.jsx` when the "Chat" tab is active. Renders the accessible in-development notice. |
| **`ChannelList`** | `src/features/chat/components/ChannelList/` | **Prototype (Isolated)** | Sidebar channel navigation with mobile drawer support, active channel highlight, and trigger for adding channels. |
| **`ChatHeader`** | `src/features/chat/components/ChatHeader/` | **Prototype (Isolated)** | Top header displaying active channel name, description, mobile navigation toggles, and message search bar. |
| **`ChatInput`** | `src/features/chat/components/ChatInput/` | **Prototype (Isolated)** | Message drafting bar with 1,000-character limit counter, send button, edit mode banner, and cancel actions. (Lint-clean with render-time state adjustment). |
| **`MessageFeed`** | `src/features/chat/components/MessageFeed/` | **Prototype (Isolated)** | Scrollable message container with pinned messages banner, automatic jump-to-bottom on new messages, and unpin actions. |
| **`MessageItem`** | `src/features/chat/components/MessageItem/` | **Prototype (Isolated)** | Individual message card with sender avatar, timestamp, role badge, markdown/text body, emoji reaction picker, reply, edit, pin, and delete actions. |
| **`MemberList`** | `src/features/chat/components/MemberList/` | **Prototype (Isolated)** | Drawer/sidebar showing group member presence (mock placeholders). Will be replaced with real group member data from `groupApi.getGroupMembersSummary()`. |
| **`AddChannelModal`**| `src/features/chat/components/AddChannelModal/`| **Prototype (Isolated)** | Accessible modal dialog for creating a new channel with automatic slug formatting. |
| **`ConfirmDeleteModal`**| `src/features/chat/components/ConfirmDeleteModal/`| **Prototype (Isolated)**| Confirmation modal for message deletion or channel removal. |
| **`MessageCard`** | `src/features/chat/components/MessageCard.jsx` | **Removed (Dead Stub)** | Empty 6-line dummy stub (`return null;`) superseded by `MessageItem`. Safely removed during FE-005. |

---

## 3. Why Components Are Isolated

Exposing the existing chat prototype directly in the production dashboard would result in:
1. **Misleading User Experience:** Users would assume messages sent in the UI are shared with study group members and persisted. Since no backend messaging endpoint exists, messages would vanish on page refresh.
2. **Mock Presence Confusion:** The prototype `MemberList` contains hardcoded mock users ("Sarah Chen", "Alex Rivera") rather than actual study group members.
3. **Data Loss:** Edits, channel additions, and deletions would remain purely in client-side ephemeral state.

To adhere to the principle of **no broken or misleading interactions in production**, the interactive components remain safely isolated within this feature directory while planned backend services are implemented.

---

## 4. Backend Requirements for Production Activation

To transition the chat feature from prototype to production, the Spring Boot backend must implement the following capabilities:

### A. Real-Time Transport (WebSocket / STOMP)
- **Configuration:** Spring WebSocket with STOMP broker (`@EnableWebSocketMessageBroker`).
- **Endpoints:**
  - Connection handshake: `/ws` (with JWT authentication interceptor).
  - Application destination prefix: `/app` (e.g., `/app/chat.send`, `/app/chat.react`).
  - Broker topics: `/topic/group.{groupId}.channel.{channelId}` for broadcast to active group members.

### B. Domain Models & Database Schema
- **`Channel` entity:** `id`, `groupId`, `name`, `description`, `isDefault`, `createdAt`, `createdBy`.
- **`ChatMessage` entity:** `id`, `channelId`, `senderId`, `content`, `isPinned`, `replyToMessageId`, `createdAt`, `updatedAt`.
- **`MessageReaction` entity:** `id`, `messageId`, `userId`, `emoji`, `createdAt`.

### C. REST API Endpoints
- `GET /api/groups/{groupId}/channels` — List channels for the active group.
- `POST /api/groups/{groupId}/channels` — Create a new channel (admin/owner only).
- `DELETE /api/groups/{groupId}/channels/{channelId}` — Delete a channel.
- `GET /api/channels/{channelId}/messages?page=0&size=50` — Paginated message history.
- `PUT /api/channels/{channelId}/messages/{messageId}/pin` — Pin/unpin a message.

### D. Security & Permissions
- Verify user's group membership before allowing STOMP channel subscription.
- Prevent non-members from reading or publishing messages to private group channels.

---

## 5. Integration Plan (Once Backend is Ready)

1. Create a `chatApi.js` service module in `src/api/` using the standard `apiClient`.
2. Implement a `useChat` custom hook utilizing `@stomp/stompjs` (or native WebSocket) for connection management, reconnection, and optimistic message queueing.
3. Replace the mock member list in `MemberList.jsx` with real member data from `groupApi`.
4. Update `ChatPage.jsx` to assemble `ChannelList`, `ChatHeader`, `MessageFeed`, `ChatInput`, and `MemberList` into the responsive layout defined in `ChatPage.module.css`.
5. Connect `ChatPage` in `Dashboard.jsx`, passing the active group ID and current user profile.
