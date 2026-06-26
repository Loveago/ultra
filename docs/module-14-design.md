# Module 14 — Notifications

## Architecture

The notification module provides:
- **Push notifications**: FCM (Firebase Cloud Messaging) via HTTP API
- **SMS**: Twilio REST API
- **Email**: Nodemailer SMTP
- **In-app notifications**: Stored in DB, delivered via Socket.IO
- **Queue-based dispatch**: Notifications enqueued via BullMQ for async processing
- **User preferences**: Per-channel opt-in/out, FCM token management

### Notification flow
```
Event occurs → sendNotification() called
→ Notification record created in DB
→ Job added to BullMQ notification queue
→ Worker processes job → dispatches to enabled channels
→ Push (FCM) / SMS (Twilio) / Email (SMTP) sent
→ In-app notification available via REST + Socket.IO
```

## Database Design

### New enums
| Enum | Values |
|---|---|
| `NotificationChannel` | PUSH, SMS, EMAIL, IN_APP |
| `NotificationType` | ORDER_STATUS, PAYMENT_SUCCESS, PAYMENT_FAILED, DELIVERY_UPDATE, NEW_MESSAGE, PROMOTION, REVIEW_REQUEST, SYSTEM, ORDER_ASSIGNED, ESCROW_RELEASED, SETTLEMENT_COMPLETED |

### New tables

| Table | Purpose |
|---|---|
| `Notification` | userId, type, title, body, data (JSON), channels, read, readAt |
| `NotificationPreference` | 1:1 with User — pushEnabled, smsEnabled, emailEnabled, inAppEnabled, fcmToken |

### Key design decisions
- **Channel filtering**: Only sends to channels enabled in user preferences
- **Queue-based**: BullMQ queue for async dispatch (retries, rate limiting)
- **Auto-create preferences**: Defaults to all channels enabled
- **FCM token management**: Users register/update FCM tokens via preferences API
- **Graceful degradation**: Missing config (FCM/Twilio/SMTP) logs warning, doesn't crash

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/notifications` | Bearer | List notifications (paginated, unreadOnly filter) |
| GET | `/api/v1/notifications/unread-count` | Bearer | Unread count |
| PUT | `/api/v1/notifications/:id/read` | Bearer | Mark single notification as read |
| PUT | `/api/v1/notifications/read-all` | Bearer | Mark all as read |
| GET | `/api/v1/notifications/preferences` | Bearer | Get notification preferences |
| PUT | `/api/v1/notifications/preferences` | Bearer | Update preferences |
| POST | `/api/v1/notifications/send` | ADMIN | Send notification to any user |

## Security Implications

1. **All endpoints require authentication**
2. **User-scoped**: Users can only view/manage their own notifications
3. **Admin-only send**: Only ADMIN/SUPER_ADMIN can send notifications to arbitrary users
4. **Preference-based filtering**: Notifications only sent via channels user has opted into
5. **No secrets exposed**: FCM/Twilio/SMTP keys in env vars only

## Scalability Considerations

- Notification indexed on `userId`, `read`, `type`, `createdAt` for efficient queries
- BullMQ queue provides retries (3 attempts), rate limiting, and dead letter handling
- For high-volume: notification queue can be processed by multiple workers
- In-app notifications paginated to prevent large payloads
- FCM/Twilio/SMTP calls are async — don't block API responses

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `FCM_SERVER_KEY` | (empty) | Firebase Cloud Messaging server key |
| `TWILIO_ACCOUNT_SID` | (empty) | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | (empty) | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | (empty) | Twilio sender phone number |
| `SMTP_HOST` | (empty) | SMTP server host |
| `SMTP_PORT` | 587 | SMTP server port |
| `SMTP_USER` | (empty) | SMTP username |
| `SMTP_PASS` | (empty) | SMTP password |
| `SMTP_FROM` | noreply@ultra.app | Sender email address |

## Files Added/Modified

- `prisma/schema.prisma` — 2 new enums, 2 new models, notifications relation on User
- `prisma/migrations/20260625124834_notifications_system/migration.sql` — Migration applied
- `src/config/env.ts` — Added FCM, Twilio, SMTP env vars
- `.env.example` — Added notification env vars
- `src/modules/notification/notification.schema.ts` — Zod validation
- `src/modules/notification/notification.service.ts` — Send, list, mark read, preferences, FCM/SMS/Email dispatch
- `src/modules/notification/notification.controller.ts` — HTTP controllers
- `src/modules/notification/notification.routes.ts` — Routes with RBAC
- `tests/notification.schema.test.ts` — 10 unit tests for schema validation
