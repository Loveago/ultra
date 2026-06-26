# Module 13 — Messaging System

## Architecture

The messaging module provides:
- **Conversation-based messaging**: Customer ↔ Rider, Customer ↔ Merchant, Admin ↔ Users
- **Conversation types**: ORDER (linked to order), DELIVERY (linked to assignment), SUPPORT, DIRECT
- **Attachments**: Messages support file URLs (images, files, audio, video)
- **Read receipts**: Per-participant `lastReadAt` + `unreadCount`, per-message `readBy` array
- **Real-time delivery**: Socket.IO events for instant message delivery + typing indicators

### Socket.IO event flow
```
User connects → subscribes to conversation room
→ Another user sends message:send
→ Server creates message + increments unread counts
→ Server broadcasts message:new to conversation room
→ Server sends message:notification to offline participants
→ User reads → emits message:read → server broadcasts message:read_receipt
```

## Database Design

### New enum
| Enum | Values |
|---|---|
| `ConversationType` | ORDER, DELIVERY, SUPPORT, DIRECT |

### New tables

| Table | Purpose |
|---|---|
| `Conversation` | Type, contextId (orderId/assignmentId), timestamps |
| `ConversationParticipant` | N:1 with Conversation + User — lastReadAt, unreadCount |
| `Message` | N:1 with Conversation — senderId, content, attachments (JSON), readBy (JSON) |

### Key design decisions
- **Unique participant constraint**: `@@unique([conversationId, userId])` prevents duplicates
- **ORDER conversation dedup**: If an ORDER conversation with same contextId exists, returns it
- **Attachments as JSON**: Flexible array of `{url, type, name}` objects (max 5 per message)
- **Read tracking**: Both per-participant (unreadCount) and per-message (readBy array)
- **Conversation updatedAt**: Updated on each message for sorting
- **Unread increment**: Non-sender participants get unreadCount incremented atomically

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/messages/conversations` | Bearer | Create or get conversation |
| GET | `/api/v1/messages/conversations` | Bearer | List my conversations (paginated) |
| GET | `/api/v1/messages/conversations/:id` | Bearer | Get conversation details |
| POST | `/api/v1/messages/conversations/:id/messages` | Bearer | Send message |
| PUT | `/api/v1/messages/conversations/:id/read` | Bearer | Mark conversation as read |
| GET | `/api/v1/messages/conversations/:id/messages` | Bearer | Paginated message history |
| GET | `/api/v1/messages/unread-count` | Bearer | Total unread count across all conversations |

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `message:subscribe` | Client → Server | Subscribe to conversation room |
| `message:unsubscribe` | Client → Server | Leave conversation room |
| `message:send` | Client → Server | Send message via socket |
| `message:new` | Server → Client | New message broadcast |
| `message:notification` | Server → Client | Unread notification for offline users |
| `message:read` | Client → Server | Mark conversation as read |
| `message:read_receipt` | Server → Client | Read receipt broadcast |
| `message:typing` | Client → Server | Typing indicator |
| `message:subscribed` | Server → Client | Subscription confirmation |

## Security Implications

1. **All endpoints require authentication**
2. **Participant-only access**: Users can only access conversations they're a participant in
3. **Socket authentication**: JWT verified on connection (from Module 12)
4. **Sender validation**: Only conversation participants can send messages
5. **Attachment limits**: Max 5 attachments per message, validated types only
6. **Content limits**: Messages max 5000 characters
7. **ORDER conversation ownership**: Existing ORDER conversations checked for participant membership

## Scalability Considerations

- ConversationParticipant has unique constraint on `[conversationId, userId]` for fast lookups
- Message indexed on `conversationId`, `senderId`, and `createdAt` for efficient queries
- Conversation indexed on `type` and `contextId` for dedup lookups
- Unread count uses atomic `increment` — no race conditions
- Socket.IO rooms enable efficient message broadcasting
- For high-volume: message history pagination prevents large payloads
- For scale: Socket.IO Redis adapter for multi-instance broadcasting
- For archival: old conversations can be archived by `updatedAt` age

## Files Added/Modified

- `prisma/schema.prisma` — 1 new enum, 3 new models, conversations relation on User
- `prisma/migrations/20260625123752_messaging_system/migration.sql` — Migration applied
- `src/modules/messaging/messaging.schema.ts` — Zod validation for messaging inputs
- `src/modules/messaging/messaging.service.ts` — Conversation CRUD, message send, read receipts, unread count
- `src/modules/messaging/messaging.socket.ts` — Socket.IO event handlers for real-time messaging
- `src/modules/messaging/messaging.controller.ts` — HTTP controllers
- `src/modules/messaging/messaging.routes.ts` — REST routes with authentication
- `src/infrastructure/socket/socket.ts` — Extended with messaging event delegation
- `tests/messaging.schema.test.ts` — 12 unit tests for schema validation
