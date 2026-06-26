# Module 11 — Rider Platform

## Architecture

The rider module provides:
- **Rider registration**: Users can register as riders (role updated to RIDER)
- **Verification**: Document upload (license, ID, insurance) + admin approval workflow
- **Vehicle management**: Multiple vehicles per rider, one active at a time
- **Rider wallet**: Reuses Wallet from Module 9 (rider is a User with wallet)
- **Earnings tracking**: Total + daily earnings from completed deliveries
- **Delivery assignment**: Admin assigns order store groups to approved, online riders
- **Assignment lifecycle**: ASSIGNED → ACCEPTED → PICKED_UP → DELIVERED (or REJECTED/CANCELLED)
- **Route tracking**: GPS waypoints recorded during active delivery

### Assignment lifecycle
```
Admin assigns → ASSIGNED → Rider accepts → ACCEPTED
→ Rider picks up → PICKED_UP (store group: OUT_FOR_DELIVERY)
→ Rider delivers → DELIVERED (store group: DELIVERED, rider stats updated)
```

## Database Design

### New enums
| Enum | Values |
|---|---|
| `RiderStatus` | PENDING, APPROVED, REJECTED, SUSPENDED |
| `VehicleType` | MOTORCYCLE, BICYCLE, CAR, VAN, TRUCK |
| `DocumentType` | DRIVERS_LICENSE, NATIONAL_ID, PASSPORT, VEHICLE_REGISTRATION, INSURANCE, PROOF_OF_ADDRESS |
| `AssignmentStatus` | ASSIGNED, ACCEPTED, REJECTED, PICKED_UP, DELIVERED, CANCELLED |

### New tables

| Table | Purpose |
|---|---|
| `Rider` | 1:1 with User — status, isOnline, location, rating, totalDeliveries, totalEarnings |
| `RiderDocument` | N:1 with Rider — type, fileUrl, verified |
| `Vehicle` | N:1 with Rider — type, plate, model, color, isActive |
| `DeliveryAssignment` | 1:1 with OrderStoreGroup — riderId, status, timestamps |
| `RouteTracking` | N:1 with DeliveryAssignment — lat/lng/heading/speed + timestamp |

### Key design decisions
- **Rider is a User**: Registration updates user role to RIDER, creates Rider profile
- **One active vehicle**: Only one vehicle can be active at a time (enforced in service)
- **Assignment per store group**: Each store group in a multi-vendor order gets its own rider
- **Store group status sync**: Pickup sets store group to OUT_FOR_DELIVERY, delivery sets to DELIVERED
- **Route tracking**: Every GPS update creates a RouteTracking record + updates rider's current location
- **Earnings**: Calculated from delivery fees of completed assignments

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/riders/register` | Bearer | Register as rider |
| GET | `/api/v1/riders/me` | Bearer | Get rider profile |
| PUT | `/api/v1/riders/me` | Bearer | Update rider profile |
| POST | `/api/v1/riders/me/documents` | Bearer | Upload document |
| GET | `/api/v1/riders/me/documents` | Bearer | List documents |
| POST | `/api/v1/riders/me/vehicles` | Bearer | Add vehicle |
| GET | `/api/v1/riders/me/vehicles` | Bearer | List vehicles |
| PUT | `/api/v1/riders/me/vehicles/:id` | Bearer | Update vehicle |
| DELETE | `/api/v1/riders/me/vehicles/:id` | Bearer | Remove vehicle |
| PUT | `/api/v1/riders/me/status` | Bearer | Toggle online/offline |
| GET | `/api/v1/riders/me/earnings` | Bearer | Earnings summary |
| GET | `/api/v1/riders/me/assignments` | Bearer | List assignments |
| PUT | `/api/v1/riders/assignments/:id/accept` | Bearer | Accept assignment |
| PUT | `/api/v1/riders/assignments/:id/reject` | Bearer | Reject assignment |
| PUT | `/api/v1/riders/assignments/:id/pickup` | Bearer | Mark picked up |
| PUT | `/api/v1/riders/assignments/:id/deliver` | Bearer | Mark delivered |
| POST | `/api/v1/riders/assignments/:id/location` | Bearer | Update GPS location |
| POST | `/api/v1/riders/admin/verify/:riderId` | ADMIN | Approve/reject/suspend rider |
| GET | `/api/v1/riders/admin/list` | ADMIN | List all riders |
| POST | `/api/v1/riders/admin/assign` | ADMIN | Assign order to rider |

## Security Implications

1. **All endpoints require authentication**
2. **Rider self-service**: Riders can only manage their own profile, documents, vehicles
3. **Online gate**: Only APPROVED riders can go online
4. **Assignment ownership**: Riders can only accept/reject/pickup/deliver their own assignments
5. **Admin verification**: Only ADMIN/SUPER_ADMIN can approve, reject, or suspend riders
6. **Assignment validation**: Admin can only assign to approved + online riders
7. **Duplicate assignment prevention**: Unique constraint on `storeGroupId` prevents double-assignment
8. **Assignment state machine**: Each transition validates previous state (e.g., can't deliver before pickup)

## Scalability Considerations

- Rider indexed on `status` and `isOnline` for fast available-rider queries
- DeliveryAssignment indexed on `riderId` and `status` for rider dashboard
- RouteTracking indexed on `assignmentId` and `createdAt` for time-ordered replay
- Vehicle indexed on `riderId` for fast vehicle listing
- RiderDocument indexed on `riderId` and `type` for verification queries
- For high-volume route tracking: RouteTracking can be moved to Redis with periodic batch insert
- For auto-assignment: Rider location + isOnline index enables geospatial queries for nearest rider

## Files Added/Modified

- `prisma/schema.prisma` — 4 new enums, 5 new models, rider relation on User, deliveryAssignment on OrderStoreGroup
- `prisma/migrations/20260625122124_rider_platform/migration.sql` — Migration applied
- `src/modules/rider/rider.schema.ts` — Zod validation for rider inputs
- `src/modules/rider/rider.service.ts` — Registration, documents, vehicles, assignments, earnings, location
- `src/modules/rider/rider.controller.ts` — HTTP controllers
- `src/modules/rider/rider.routes.ts` — Routes with RBAC (rider self-service + admin)
- `tests/rider.schema.test.ts` — 13 unit tests for schema validation
