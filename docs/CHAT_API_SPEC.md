# StudyCollab Chat — API & STOMP Protocol Specification

> **Module**: Chat Feature  
> **Status**: Approved Specification  
> **Related Issues**: CHAT-01 (#73), CHAT-03 (#75), CHAT-05 (#77)  
> **Last Updated**: November 2026  

---

## 1. REST API Endpoints

All REST requests require the standard Bearer token header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### 1.1 Channels API

#### `GET /api/groups/{groupId}/channels`
List all channels belonging to the specified study group.

* **Authorization**: User must be an active member of `groupId`.
* **Responses**:
  * **`200 OK`**:
    ```json
    [
      {
        "id": 1,
        "groupId": 10,
        "name": "general",
        "description": "General discussions and welcome messages",
        "isDefault": true,
        "createdAt": "2026-11-01T12:00:00Z"
      },
      {
        "id": 2,
        "groupId": 10,
        "name": "exam-prep",
        "description": "Midterm and final review coordination",
        "isDefault": false,
        "createdAt": "2026-11-01T12:30:00Z"
      }
    ]
    ```
  * **`403 Forbidden`**: Caller is not a member of the study group.
  * **`404 Not Found`**: Study group does not exist.

---

#### `POST /api/groups/{groupId}/channels`
Create a new channel within the study group.

* **Authorization**: User must be an `ADMIN` or `CREATOR` of `groupId`.
* **Request Body**:
  ```json
  {
    "name": "homework-help",
    "description": "Discuss problem sets and lab work"
  }
  ```
* **Validation Rules**:
  * `name`: Required, 2-50 characters, lowercase alphanumeric with hyphens (`^[a-z0-9-]+$`).
  * `description`: Optional, max 255 characters.
* **Responses**:
  * **`201 Created`**: Returns created `ChannelResponseDTO`.
  * **`400 Bad Request`**: Validation error or channel name already exists in this group.
  * **`403 Forbidden`**: User is a standard member without admin rights.

---

#### `DELETE /api/groups/{groupId}/channels/{channelId}`
Delete a custom channel.

* **Authorization**: User must be an `ADMIN` or `CREATOR` of `groupId`.
* **Responses**:
  * **`204 No Content`**: Successfully deleted.
  * **`400 Bad Request`**: Cannot delete the default channel (`isDefault == true`).
  * **`403 Forbidden`**: Caller lacks administrative role.
  * **`404 Not Found`**: Channel does not exist or does not belong to group.

---

### 1.2 Message History & Pinning API

#### `GET /api/channels/{channelId}/messages`
Retrieve paginated message history using cursor-based (keyset) pagination.

* **Query Parameters**:
  * `before` *(optional, Long)*: Cursor message ID. If provided, returns messages with `id < before`. If omitted, returns the most recent messages.
  * `limit` *(optional, Integer, default 50, max 100)*: Number of messages to return.
* **Authorization**: User must belong to the study group that owns `channelId`.
* **Response `200 OK`**:
  ```json
  {
    "channelId": 1,
    "hasMore": true,
    "nextCursor": 1045,
    "messages": [
      {
        "id": 1095,
        "channelId": 1,
        "content": "Does anyone have the notes from Tuesday's lecture?",
        "sender": {
          "id": 5,
          "name": "Alex Rivera",
          "avatarUrl": "https://pub-.../avatar5.png",
          "groupRole": "MEMBER"
        },
        "isPinned": false,
        "isDeleted": false,
        "replyTo": null,
        "reactions": [
          { "emoji": "👍", "count": 2, "reactedByMe": true }
        ],
        "createdAt": "2026-11-01T14:30:00Z",
        "updatedAt": null
      },
      {
        "id": 1096,
        "channelId": 1,
        "content": "Uploaded them to the files tab just now!",
        "sender": {
          "id": 8,
          "name": "Sarah Chen",
          "avatarUrl": null,
          "groupRole": "ADMIN"
        },
        "isPinned": false,
        "isDeleted": false,
        "replyTo": {
          "id": 1095,
          "senderName": "Alex Rivera",
          "contentSnippet": "Does anyone have the notes..."
        },
        "reactions": [
          { "emoji": "🎉", "count": 3, "reactedByMe": false }
        ],
        "createdAt": "2026-11-01T14:32:00Z",
        "updatedAt": null
      }
    ]
  }
  ```

---

#### `PUT /api/channels/{channelId}/messages/{messageId}/pin`
Toggle or set the pinned status of a message.

* **Authorization**: Group member (`isPinned` can be toggled by any active member or admin).
* **Request Body**:
  ```json
  {
    "isPinned": true
  }
  ```
* **Responses**:
  * **`200 OK`**: Updated `ChatMessageResponseDTO`.
  * **`404 Not Found`**: Message does not exist.

---

#### `GET /api/channels/{channelId}/pinned`
List all pinned messages for a channel.

* **Response `200 OK`**:
  ```json
  [
    {
      "id": 1020,
      "channelId": 1,
      "content": "Midterm Exam scheduled for Nov 15 at 10:00 AM in Hall B",
      "sender": {
        "id": 2,
        "name": "Instructor Lead",
        "avatarUrl": null,
        "groupRole": "CREATOR"
      },
      "isPinned": true,
      "createdAt": "2026-10-28T09:00:00Z"
    }
  ]
  ```

---

## 2. Real-Time STOMP Protocol Specification

### 2.1 Handshake & Authentication Frame

```text
CONNECT
accept-version:1.2,1.1,1.0
heart-beat:10000,10000
Authorization:Bearer <JWT_ACCESS_TOKEN>

^@
```

### 2.2 Inbound Message Destinations (`/app`)

#### 1. Send Message
* **Destination**: `/app/chat.send`
* **Payload**:
  ```json
  {
    "groupId": 10,
    "channelId": 1,
    "content": "Hello team, let's start the study session!",
    "replyToId": null
  }
  ```

#### 2. Edit Message
* **Destination**: `/app/chat.edit`
* **Payload**:
  ```json
  {
    "groupId": 10,
    "channelId": 1,
    "messageId": 1096,
    "content": "Uploaded them to the files tab just now! (Updated v2)"
  }
  ```

#### 3. Delete Message
* **Destination**: `/app/chat.delete`
* **Payload**:
  ```json
  {
    "groupId": 10,
    "channelId": 1,
    "messageId": 1096
  }
  ```

#### 4. React to Message
* **Destination**: `/app/chat.react`
* **Payload**:
  ```json
  {
    "groupId": 10,
    "channelId": 1,
    "messageId": 1096,
    "emoji": "👍"
  }
  ```

---

### 2.3 Outbound Broadcast Events (`/topic`)

Channel members subscribe to:
```
/topic/group.{groupId}.channel.{channelId}
```

All broadcast events share a standard envelope structure:

```json
{
  "type": "CHAT_MESSAGE | MESSAGE_EDITED | MESSAGE_DELETED | REACTION_UPDATED | PIN_UPDATED",
  "channelId": 1,
  "timestamp": "2026-11-01T14:32:00Z",
  "payload": { ... }
}
```

#### Event Payloads:

* **`CHAT_MESSAGE`**:
  ```json
  {
    "type": "CHAT_MESSAGE",
    "channelId": 1,
    "timestamp": "2026-11-01T14:32:00Z",
    "payload": {
      "id": 1097,
      "content": "Here is the summary link.",
      "sender": { "id": 5, "name": "Alex", "avatarUrl": null, "groupRole": "MEMBER" },
      "replyTo": null,
      "isPinned": false,
      "isDeleted": false,
      "createdAt": "2026-11-01T14:32:00Z"
    }
  }
  ```

* **`MESSAGE_EDITED`**:
  ```json
  {
    "type": "MESSAGE_EDITED",
    "channelId": 1,
    "timestamp": "2026-11-01T14:35:00Z",
    "payload": {
      "id": 1097,
      "content": "Here is the revised summary link.",
      "updatedAt": "2026-11-01T14:35:00Z"
    }
  }
  ```

* **`MESSAGE_DELETED`**:
  ```json
  {
    "type": "MESSAGE_DELETED",
    "channelId": 1,
    "timestamp": "2026-11-01T14:36:00Z",
    "payload": {
      "id": 1097,
      "isDeleted": true
    }
  }
  ```

* **`REACTION_UPDATED`**:
  ```json
  {
    "type": "REACTION_UPDATED",
    "channelId": 1,
    "timestamp": "2026-11-01T14:37:00Z",
    "payload": {
      "messageId": 1097,
      "reactions": [
        { "emoji": "👍", "count": 3 },
        { "emoji": "❤️", "count": 1 }
      ]
    }
  }
  ```

* **`PIN_UPDATED`**:
  ```json
  {
    "type": "PIN_UPDATED",
    "channelId": 1,
    "timestamp": "2026-11-01T14:38:00Z",
    "payload": {
      "messageId": 1097,
      "isPinned": true
    }
  }
  ```

