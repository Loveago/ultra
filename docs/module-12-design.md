# Module 12 — Real-Time Delivery Tracking

## Architecture

The tracking module provides:
- **Socket.IO server**: JWT-authenticated WebSocket connections for real-time updates
- **GPS updates**: Riders send location data via `rider:location` event, broadcast to subscribers
- **Live delivery tracking**: Customers subscribe to delivery rooms and receive location + ETA updates
- **ETA calculation**: Haversine distance + average speed (20 km/h) → estimated minutes
- **Route history**: REST endpoints to retrieve past route tracking data

### Socket.IO event flow
```
Rider connects → sends rider:location event
→ Server saves RouteTracking record + updates Rider location
→ Server calculates ETA
→ Server broadcasts delivery:update + delivery:eta to room subscribers
→ Customer receives real-time location + ETA
```

### Room structure
- `delivery:{assignmentId}` — Per-assignment room for location updates
- `order:{orderId}` — Per-order room for multi-vendor tracking

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `delivery:subscribe` | Client → Server | Subscribe to delivery updates (by assignmentId or orderId) |
| `delivery:unsubscribe` | Client → Server | Leave delivery room |
| `delivery:subscribed` | Server → Client | Confirmation of subscription |
| `rider:location` | Rider → Server | GPS update with lat/lng/heading/speed |
| `delivery:update` | Server → Client | Broadcast rider location to subscribers |
| `delivery:eta` | Server → Client | ETA update (minutes + distance) |
| `delivery:status` | Server → Client | Delivery status change notification |
| `delivery:picked_up` | Server → Client | Rider picked up order |
| `delivery:completed` | Server → Client | Delivery completed |
| `error` | Server → Client | Error message |

## REST API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/tracking/delivery/:assignmentId` | Bearer | Get delivery tracking + route history + ETA |
| GET | `/api/v1/tracking/order/:orderId` | Bearer | Get all delivery tracking for an order |

## ETA Calculation

- **Algorithm**: Haversine formula for great-circle distance
- **Average speed**: 20 km/h (configurable constant)
- **Destination**: Store branch (when ACCEPTED) or delivery address (when PICKED_UP)
- **Output**: `{ minutes: number, distanceKm: number }`

## Security Implications

1. **Socket authentication**: JWT verified on connection via middleware
2. **Subscription authorization**: Customers can only subscribe to their own deliveries
3. **Rider-only location updates**: Only RIDER role can send `rider:location` events
4. **Assignment ownership**: Riders can only update location for their own assignments
5. **REST endpoints require authentication**
6. **CORS**: Socket.IO configured with wildcard origin (should be restricted in production)

## Scalability Considerations

- Socket.IO rooms enable efficient broadcasting — only subscribers receive updates
- RouteTracking records indexed on `assignmentId` + `createdAt` for fast history queries
- For high-volume: GPS updates can be throttled client-side (e.g., every 5 seconds)
- For scale: Socket.IO can use Redis adapter for multi-instance broadcasting
- Route history limited to 50 records per REST query to prevent large payloads
- For production: replace wildcard CORS with specific origins

## Files Added/Modified

- `src/infrastructure/socket/socket.ts` — Extended with JWT auth + tracking event delegation
- `src/modules/tracking/tracking.socket.ts` — Socket.IO event handlers (subscribe, location, status)
- `src/modules/tracking/tracking.service.ts` — ETA calculation (Haversine), delivery/order tracking
- `src/modules/tracking/tracking.controller.ts` — REST controllers for tracking queries
- `src/modules/tracking/tracking.routes.ts` — REST routes for tracking
- `tests/tracking.service.test.ts` — 4 unit tests for ETA/distance calculation
