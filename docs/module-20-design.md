# Module 20 — Fraud & Security

## Architecture
Audit logging, risk scoring, device fingerprinting, IP blocking, and abuse detection.

## Database Design
### New enums: `RiskLevel` (LOW, MEDIUM, HIGH, BLOCKED), `AuditAction` (16 actions)
### New tables
| Table | Purpose |
|---|---|
| `AuditLog` | userId, action, resource, IP, user agent, metadata, risk level |
| `DeviceFingerprint` | userId, fingerprint, device info, trusted status |
| `RiskScore` | Entity-based risk scoring with factors and resolution tracking |
| `BlockedIp` | IP blocklist with reason and admin who blocked |

## API Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/security/devices` | Bearer | Register device fingerprint |
| GET | `/api/v1/security/devices` | Bearer | List user devices |
| PUT | `/api/v1/security/devices/:id/trust` | Bearer | Trust/untrust device |
| POST | `/api/v1/security/audit` | Bearer | Log audit event |
| GET | `/api/v1/security/audit` | ADMIN | List audit logs (filterable) |
| GET | `/api/v1/security/risk-scores` | ADMIN | List risk scores |
| PUT | `/api/v1/security/risk-scores/:id/resolve` | ADMIN | Resolve risk score |
| POST | `/api/v1/security/blocked-ips` | ADMIN | Block IP |
| GET | `/api/v1/security/blocked-ips` | ADMIN | List blocked IPs |
| DELETE | `/api/v1/security/blocked-ips/:ipAddress` | ADMIN | Unblock IP |
| GET | `/api/v1/security/blocked-ips/:ipAddress/check` | ADMIN | Check if IP blocked |

## Risk Scoring Factors
- Rapid orders (>5/hour): +20
- Failed payments (>3/24h): +25
- Untrusted devices (>3): +15
- Rapid withdrawals (>3/24h): +20
- High-value orders (>2/24h): +15

## Files
- `src/modules/security/security.schema.ts` — Zod validation
- `src/modules/security/security.service.ts` — Audit, devices, risk scoring, IP blocking
- `src/modules/security/security.controller.ts` — HTTP controllers
- `src/modules/security/security.routes.ts` — Routes with RBAC
- `tests/security.schema.test.ts` — 8 tests
