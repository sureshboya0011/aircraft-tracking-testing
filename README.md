# ✈️ Aircraft Maintenance Tracker

Track aircraft maintenance status through the lifecycle:

```
SCHEDULED  →  IN_PROGRESS  →  COMPLETED
```

Built incrementally following the Feature Ladder from the problem statement.

---

## Tech stack

- **Node.js + Express** (REST API)
- **In-memory store** (no database)
- **Vanilla HTML/JS** demo UI

## Run

```powershell
npm install
npm start
```

App: http://localhost:3000  
Health: http://localhost:3000/health  
Demo UI: http://localhost:3000/

---

## Data model

| Field             | Type    | Notes                                            |
| ----------------- | ------- | ------------------------------------------------ |
| `aircraftId`      | string  | Unique. Required.                                |
| `name`            | string  | Required.                                        |
| `status`          | enum    | `SCHEDULED` \| `IN_PROGRESS` \| `COMPLETED`      |
| `maintenanceDate` | string  | `YYYY-MM-DD`. Required.                          |
| `engineerName`    | string  | Required.                                        |
| `history`         | array   | `{ status, at }` entries (Feature 5).            |

---

## Feature Ladder ✅

### Feature 0 — Start your app
- `GET /health` → `OK`

### Feature 1 — Aircraft Registration
- `POST /aircraft` — register a new aircraft (defaults to `SCHEDULED`).
- `GET  /aircraft` — list all aircraft.

### Feature 2 — Update Maintenance Status
- `PATCH /aircraft/:id/status` — body `{ "status": "IN_PROGRESS" }`.
- Only forward transitions allowed: `SCHEDULED → IN_PROGRESS → COMPLETED`.

### Feature 3 — Smart Tracking
- `GET /aircraft/in-progress` — aircraft currently in progress.
- `GET /aircraft/scheduled-today` — aircraft scheduled for today.

### Feature 4 — Robustness
- Unique `aircraftId` enforced (HTTP 409 on duplicates).
- Invalid transitions rejected with a clear error (HTTP 400).
- Centralized JSON error handler.

### Feature 5 — Bonus
- Per-aircraft status `history` with timestamps.
- `GET /aircraft/summary` — `{ total, scheduled, inProgress, completed }`.

---

## API quick reference

| Method | Path                          | Description                          |
| ------ | ----------------------------- | ------------------------------------ |
| GET    | `/health`                     | Liveness check                       |
| POST   | `/aircraft`                   | Register aircraft                    |
| GET    | `/aircraft`                   | List all                             |
| GET    | `/aircraft/in-progress`       | Currently in progress                |
| GET    | `/aircraft/scheduled-today`   | Scheduled for today                  |
| GET    | `/aircraft/summary`           | Aggregate counts                     |
| GET    | `/aircraft/:id`               | Get one (with history)               |
| PATCH  | `/aircraft/:id/status`        | Update status (forward-only)         |

---

## Demo (PowerShell)

```powershell
# 0. Health
curl http://localhost:3000/health

# 1. Register
$today = (Get-Date -Format 'yyyy-MM-dd')
curl -Method POST http://localhost:3000/aircraft -ContentType 'application/json' `
  -Body (@{ aircraftId='AC-001'; name='Boeing 737'; maintenanceDate=$today; engineerName='Alice' } | ConvertTo-Json)

curl -Method POST http://localhost:3000/aircraft -ContentType 'application/json' `
  -Body (@{ aircraftId='AC-002'; name='Airbus A320'; maintenanceDate=$today; engineerName='Bob' } | ConvertTo-Json)

# 2. Update status (SCHEDULED -> IN_PROGRESS)
curl -Method PATCH http://localhost:3000/aircraft/AC-001/status -ContentType 'application/json' `
  -Body (@{ status='IN_PROGRESS' } | ConvertTo-Json)

# 3. Tracking
curl http://localhost:3000/aircraft/in-progress
curl http://localhost:3000/aircraft/scheduled-today

# 4. Robustness — try invalid transition (SCHEDULED -> COMPLETED)
curl -Method PATCH http://localhost:3000/aircraft/AC-002/status -ContentType 'application/json' `
  -Body (@{ status='COMPLETED' } | ConvertTo-Json)
# => 400 { "error": "Invalid transition: SCHEDULED -> COMPLETED. Allowed next: [IN_PROGRESS]." }

# 5. Bonus — history + summary
curl -Method PATCH http://localhost:3000/aircraft/AC-001/status -ContentType 'application/json' `
  -Body (@{ status='COMPLETED' } | ConvertTo-Json)
curl http://localhost:3000/aircraft/AC-001
curl http://localhost:3000/aircraft/summary
```

---

## Copilot prompts used during build

A few small, focused prompts were used to assemble the project incrementally:

1. *"Scaffold an Express app with a `/health` endpoint returning OK."*
2. *"Create an in-memory `AircraftStore` with `add` and `list`; default status `SCHEDULED`."*
3. *"Add `updateStatus` enforcing only forward transitions SCHEDULED → IN_PROGRESS → COMPLETED."*
4. *"Add `/aircraft/in-progress` and `/aircraft/scheduled-today` routes."*
5. *"Validate unique `aircraftId` and return clear error messages with proper HTTP status codes."*
6. *"Track per-aircraft history of status changes with ISO timestamps and add a summary endpoint."*
7. *"Build a minimal HTML page that calls these endpoints to demo register → update → tracking."*

---

## Project layout

```
.
├── package.json
├── public/
│   └── index.html          # Demo UI
├── src/
│   ├── server.js           # Express app + routes
│   └── aircraftStore.js    # In-memory store + transition rules
└── README.md
```
