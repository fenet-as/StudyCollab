# StudyCollab Architecture Diagrams

This document contains Mermaid diagrams illustrating core system flows and architectures across StudyCollab.

---

## 1. Real-Time Chat System Architecture

```mermaid
graph TD
    subgraph Client["React 19 Frontend"]
        UI["ChatPage Layout<br/>(ChannelList, MessageFeed, ChatInput, MemberList)"]
        Hook["useChat Hook<br/>(STOMP Client & Keyset Cache)"]
        UI <--> Hook
    end

    subgraph Backend["Spring Boot 3 Backend"]
        WS["WebSocket Handshake (/ws)"]
        SecInt["StompChannelInterceptor<br/>(JWT Auth & Group Member Guard)"]
        Broker["Simple Message Broker (/topic)"]
        ChatCtrl["ChatController<br/>(@MessageMapping /app/chat.*)"]
        RestCtrl["ChannelController & ChatMessageController<br/>(REST APIs)"]
        Service["ChatService & ChannelService"]
        
        WS --> SecInt
        SecInt --> Broker
        SecInt --> ChatCtrl
        ChatCtrl --> Service
        RestCtrl --> Service
        Service --> Broker
    end

    subgraph Storage["PostgreSQL Database"]
        DB[("PostgreSQL 16+<br/>channels, chat_messages, message_reactions")]
        Service <--> DB
    end

    Hook <-->|STOMP over WebSocket| WS
    Hook <-->|HTTP REST /api/...| RestCtrl
```

---

## 2. STOMP Connection & Subscription Guard Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React useChat)
    participant WS as WebSocket Handshake (/ws)
    participant Interceptor as StompChannelInterceptor
    participant JWT as JwtTokenProvider
    participant MemberRepo as GroupMemberRepository
    participant Broker as STOMP In-Memory Broker

    Note over User,Broker: Step 1: WebSocket Handshake & CONNECT Frame
    User->>WS: HTTP Upgrade GET /ws
    WS-->>User: 101 Switching Protocols (WebSocket Established)
    User->>Interceptor: STOMP CONNECT<br/>[Authorization: Bearer <token>]
    Interceptor->>JWT: validateToken(token)
    alt Valid Token
        JWT-->>Interceptor: Valid (User ID, Email)
        Interceptor->>Interceptor: Set StompHeaderAccessor User Principal
        Interceptor->>Broker: Forward CONNECT
        Broker-->>User: STOMP CONNECTED
    else Invalid / Expired Token
        JWT-->>Interceptor: Invalid
        Interceptor-->>User: STOMP ERROR [Unauthorized]
        Note over User: Closes connection & attempts token refresh
    end

    Note over User,Broker: Step 2: Channel Topic Subscription Guard
    User->>Interceptor: STOMP SUBSCRIBE<br/>destination: /topic/group.10.channel.1
    Interceptor->>Interceptor: Extract groupId (10), channelId (1)
    Interceptor->>MemberRepo: existsByGroupIdAndUserId(10, userId)
    alt Is Active Group Member
        MemberRepo-->>Interceptor: true
        Interceptor->>Broker: Forward SUBSCRIBE
        Broker-->>User: Subscription Active
    else Not a Group Member
        MemberRepo-->>Interceptor: false
        Interceptor-->>User: STOMP ERROR [Forbidden: Not a group member]
    end
```

---

## 3. Real-Time Message Dispatch & Broadcast Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Client A)
    participant ChatCtrl as ChatController (@MessageMapping)
    participant ChatSvc as ChatMessageService
    participant DB as PostgreSQL
    participant Broker as STOMP Broker (/topic)
    actor Bob as Bob (Client B)

    Alice->>ChatCtrl: STOMP SEND /app/chat.send<br/>{ groupId: 10, channelId: 1, content: "Hello!" }
    ChatCtrl->>ChatSvc: saveMessage(userId, channelId, content)
    ChatSvc->>DB: INSERT INTO chat_messages (...)
    DB-->>ChatSvc: Persisted Entity (id: 501, createdAt: ...)
    ChatSvc->>Broker: broadcastToTopic("/topic/group.10.channel.1", CHAT_MESSAGE, payload)
    
    par Real-time Broadcast to Channel Subscribers
        Broker-->>Alice: MESSAGE Envelope [CHAT_MESSAGE (id: 501)]
        Broker-->>Bob: MESSAGE Envelope [CHAT_MESSAGE (id: 501)]
    end
    
    Note over Alice: Reconcile optimistic message with ID 501
    Note over Bob: Append new message to bottom of feed
```

---

## 4. Keyset (Cursor-Based) History Loading Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as User (React Feed)
    participant Rest as ChatMessageController
    participant Repo as ChatMessageRepository
    participant DB as PostgreSQL

    Note over Client,DB: Initial Channel Load (Latest 50 Messages)
    Client->>Rest: GET /api/channels/1/messages?limit=50
    Rest->>Repo: findTop50ByChannelIdOrderByIdDesc(1)
    Repo->>DB: SELECT * FROM chat_messages WHERE channel_id = 1 ORDER BY id DESC LIMIT 50
    DB-->>Rest: Rows (ids: 500 down to 451)
    Rest-->>Client: { channelId: 1, hasMore: true, nextCursor: 451, messages: [...] }
    Note over Client: Invert list to chronological order (451 -> 500) & scroll to bottom

    Note over Client,DB: Infinite Scroll Upwards (Load Older History)
    Client->>Rest: GET /api/channels/1/messages?before=451&limit=50
    Rest->>Repo: findTop50ByChannelIdAndIdLessThanOrderByIdDesc(1, 451)
    Repo->>DB: SELECT * FROM chat_messages WHERE channel_id = 1 AND id < 451 ORDER BY id DESC LIMIT 50
    DB-->>Rest: Rows (ids: 450 down to 401)
    Rest-->>Client: { channelId: 1, hasMore: true, nextCursor: 401, messages: [...] }
    Note over Client: Prepend messages (401 -> 450) preserving scroll viewport position
```
