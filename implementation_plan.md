# Implementation Plan: Edge-Computed Transit System Backend

Lightweight, secure backend for Android TV edge devices on buses. Server = config storage + event sink + nightly ETA learner. All heavy math (GPS, spatial, real-time ETA) stays on the edge device.

## User Review Required

> [!IMPORTANT]
> **Schema Breaking Change**: `Route.stops` (JSONB) and `Bus.selectedStops` (JSONB) will be **dropped**. These fields are replaced by normalized `Stop` and `BusAssignment` tables. The existing admin panel frontend will break on these fields and will need updating separately (out of scope for this plan).

> [!IMPORTANT]
> **API Authentication**: All transit endpoints require `X-API-Key` header matched against `process.env.BUS_API_KEY`. Add this to your `.env`.

> [!NOTE]
> **Cron deferred**: Midnight ETA aggregation is exposed as a manual `POST /api/cron/run` endpoint instead of a scheduled job. Real cron (`node-cron`) can be wired in later.

## Design Decisions

| Decision | Chosen | Alternatives Rejected | Reason |
|---|---|---|---|
| Polyline storage | Add `polyline` TEXT field to existing `Route` model | Separate `RoutePolyline` table | Route already exists, Bus already has `routeId` FK — no new join needed |
| Stop ownership | `Stop` has `routeId` FK | Global/route-agnostic stops | Stops are logically scoped to a route |
| Ordinary vs Limited | `BusAssignment(busId, stopId, sequenceOrder)` | JSONB blob on Bus | Queryable, filterable, proper relational design |
| JSONB blobs | Drop `Route.stops` + `Bus.selectedStops` | Keep alongside | Cleaner schema, no dual source of truth |
| Scheduling | Manual `POST /api/cron/run` endpoint | `node-cron`, `pg_cron` | Simpler, testable, cron can be added later |

## Non-Functional Assumptions

- Scale: ~50 buses, ~24 stops per route, events ingested 2–10x/trip/day
- Security: static API key shared between server and edge devices
- Availability: no HA requirement — single Node.js process
- DB: `alter: true` in `sequelize.sync()` handles column additions/removals in dev

---

## Proposed Changes

---

### 1. Database Models

#### [MODIFY] [Route.js](file:///d:/Work/XOOGO/xoogo_client/server/models/Route.js)
- **ADD** `polyline`: `DataTypes.TEXT`, allowNull: true — stores encoded polyline string for Leaflet
- **REMOVE** `stops`: drop the `DataTypes.JSONB` field

#### [MODIFY] [Bus.js](file:///d:/Work/XOOGO/xoogo_client/server/models/Bus.js)
- **REMOVE** `selectedStops`: drop the `DataTypes.JSONB` field
- `busType` remains as STRING (e.g. `'ordinary'` | `'limited'`) — no change needed

---

#### [NEW] [Stop.js](file:///d:/Work/XOOGO/xoogo_client/server/models/Stop.js)
Stores static bus stop details, scoped to a route.
- `id`: UUID (Primary Key, UUIDV4)
- `name`: String, allowNull: false
- `latitude`: Float, allowNull: false
- `longitude`: Float, allowNull: false
- `routeId`: UUID (Foreign Key → Route), allowNull: false, field: `route_id`
- timestamps: true, underscored: true

#### [NEW] [BusAssignment.js](file:///d:/Work/XOOGO/xoogo_client/server/models/BusAssignment.js)
Controls which stops a bus serves and in what order (ordinary = all 24, limited = subset).
- `id`: UUID (Primary Key, UUIDV4)
- `busId`: UUID (Foreign Key → Bus), allowNull: false, field: `bus_id`
- `stopId`: UUID (Foreign Key → Stop), allowNull: false, field: `stop_id`
- `sequenceOrder`: Integer, allowNull: false, field: `sequence_order`
- timestamps: true, underscored: true

#### [NEW] [HistoricalEta.js](file:///d:/Work/XOOGO/xoogo_client/server/models/HistoricalEta.js)
Stores average travel time between consecutive stop pairs. Updated nightly by aggregation job.
- `id`: UUID (Primary Key, UUIDV4)
- `fromStopId`: UUID (Foreign Key → Stop), allowNull: false, field: `from_stop_id`
- `toStopId`: UUID (Foreign Key → Stop), allowNull: false, field: `to_stop_id`
- `averageDurationSeconds`: Integer, allowNull: false, defaultValue: 300, field: `average_duration_seconds`
- timestamps: true, underscored: true

#### [NEW] [EventLog.js](file:///d:/Work/XOOGO/xoogo_client/server/models/EventLog.js)
Ingested event stream from bus edge devices. Append-only.
- `id`: UUID (Primary Key, UUIDV4)
- `busId`: UUID (Foreign Key → Bus), allowNull: false, field: `bus_id`
- `event`: ENUM(`TRIP_STARTED`, `ARRIVED`, `DETOUR_STARTED`, `SKIPPED`, `TRIP_COMPLETED`), allowNull: false
- `stopId`: UUID, allowNull: true, field: `stop_id` — used for `ARRIVED`
- `missedStopId`: UUID, allowNull: true, field: `missed_stop_id` — used for `SKIPPED`
- `arrivedStopId`: UUID, allowNull: true, field: `arrived_stop_id` — used for `SKIPPED`
- `crossTrackError`: String, allowNull: true, field: `cross_track_error` — used for `DETOUR_STARTED`
- `timestamp`: DATE, allowNull: false — parsed ISO date from payload
- `rawTimestamp`: String, allowNull: true, field: `raw_timestamp` — exact string from device (e.g. `"06:00 AM"`)
- timestamps: true, underscored: true

---

#### [MODIFY] [models/index.js](file:///d:/Work/XOOGO/xoogo_client/server/models/index.js)
Import and register all new models. Add new associations:

```
Route.hasMany(Stop,         { foreignKey: 'route_id', as: 'stops', onDelete: 'CASCADE' })
Stop.belongsTo(Route,       { foreignKey: 'route_id', as: 'route' })

Bus.hasMany(BusAssignment,  { foreignKey: 'bus_id',  as: 'assignments', onDelete: 'CASCADE' })
BusAssignment.belongsTo(Bus, { foreignKey: 'bus_id', as: 'bus' })

Stop.hasMany(BusAssignment, { foreignKey: 'stop_id', as: 'assignments', onDelete: 'CASCADE' })
BusAssignment.belongsTo(Stop, { foreignKey: 'stop_id', as: 'stop' })

Stop.hasMany(HistoricalEta, { foreignKey: 'from_stop_id', as: 'etasFrom', onDelete: 'CASCADE' })
Stop.hasMany(HistoricalEta, { foreignKey: 'to_stop_id',   as: 'etasTo',   onDelete: 'CASCADE' })
HistoricalEta.belongsTo(Stop, { foreignKey: 'from_stop_id', as: 'fromStop' })
HistoricalEta.belongsTo(Stop, { foreignKey: 'to_stop_id',   as: 'toStop'   })

Bus.hasMany(EventLog,       { foreignKey: 'bus_id', as: 'events', onDelete: 'CASCADE' })
EventLog.belongsTo(Bus,     { foreignKey: 'bus_id', as: 'bus' })
```

Export: `{ sequelize, User, Group, Route, Bus, Stop, BusAssignment, HistoricalEta, EventLog }`

---

### 2. Seeder

#### [NEW] [transitSeeder.js](file:///d:/Work/XOOGO/xoogo_client/server/seeders/transitSeeder.js)
Run manually (`node server/seeders/transitSeeder.js`) to bootstrap transit data.

Steps (in order):
1. Find first existing `Route` record (or create one if none exist)
2. Update that Route's `polyline` field with a sample encoded polyline string
3. Bulk create **24 Stops** with realistic names, lat/lng, all linked to that Route's `routeId`
4. Find first two `Bus` records:
   - **Bus 1** (Ordinary): `BusAssignment` rows for all 24 stops with `sequenceOrder 1–24`
   - **Bus 2** (Limited): `BusAssignment` rows for 5 express stops with `sequenceOrder 1–5`
5. Bulk create `HistoricalEta` rows for each consecutive stop pair (23 pairs for ordinary route) with `averageDurationSeconds: 300`

> [!NOTE]
> Seeder uses `bulkCreate` with `ignoreDuplicates: true` so it's safe to re-run.

---

### 3. Middleware

#### [NEW] [apiKeyAuth.js](file:///d:/Work/XOOGO/xoogo_client/server/middleware/apiKeyAuth.js)
Simple header validator. Applied to all transit routes.

```js
// Logic:
// 1. Read req.headers['x-api-key']
// 2. Compare to process.env.BUS_API_KEY
// 3. If missing or mismatch → 401 { message: 'Unauthorized: Invalid API key' }
// 4. If match → next()
```

---

### 4. API Routes

#### [NEW] [transit.js](file:///d:/Work/XOOGO/xoogo_client/server/routes/transit.js)

**GET `/api/sync?bus_id=<uuid>`**
- Auth: `apiKeyAuth` middleware
- Validates `bus_id` query param present → 400 if missing
- Fetches Bus → finds Route via `bus.routeId` → gets `route.polyline`
- Fetches `BusAssignment` rows for this bus, `ORDER BY sequence_order ASC`
- Joins Stop data (`name`, `latitude`, `longitude`) for each assignment
- Fetches `HistoricalEta` rows for all consecutive stop pairs in the assignment list
- Returns:
```json
{
  "bus_id": "...",
  "route": {
    "id": "...",
    "name": "...",
    "polyline": "encoded_string_here"
  },
  "stops": [
    { "id": "...", "name": "Stop A", "latitude": 10.0, "longitude": 76.0, "sequenceOrder": 1 }
  ],
  "etas": [
    { "fromStopId": "...", "toStopId": "...", "averageDurationSeconds": 300 }
  ]
}
```

**POST `/api/events`**
- Auth: `apiKeyAuth` middleware
- Body: `{ bus_id, event, stop_id?, missed_stop_id?, arrived_stop_id?, cross_track_error?, timestamp, raw_timestamp? }`
- Validates `bus_id` and `event` present → 400 if missing
- Validates `event` is one of the 5 allowed values → 400 if invalid
- Creates `EventLog` record
- Returns: `201 { message: 'Event logged', id: '...' }`

**POST `/api/cron/run`**
- Auth: `apiKeyAuth` middleware (admin-level protection)
- Triggers ETA aggregation logic inline (same logic as eventual midnight cron)
- Aggregation steps:
  1. Query all `EventLog` rows from today (UTC)
  2. Group by `busId`, then split into trips bounded by `TRIP_STARTED` → `TRIP_COMPLETED`
  3. Within each trip, extract consecutive `ARRIVED` event pairs with their timestamps
  4. Calculate actual duration in seconds for each stop pair
  5. Group durations by `(fromStopId, toStopId)`, compute mean
  6. Update `HistoricalEta.averageDurationSeconds` for each pair
- Returns: `200 { message: 'ETA aggregation complete', updatedPairs: N }`

#### [MODIFY] [app.js](file:///d:/Work/XOOGO/xoogo_client/server/app.js)
Add import and mount:
```js
import transitRoutes from './routes/transit.js'
// ...
app.use('/api', transitRoutes)
```

---

### 5. Test Script

#### [NEW] [test-transit.js](file:///d:/Work/XOOGO/xoogo_client/server/test-transit.js)
Standalone Node.js script. Run with `node server/test-transit.js`.

Tests (sequential):
1. **Auth guard** — GET `/api/sync` with no key → expect 401
2. **Auth guard** — GET `/api/sync` with wrong key → expect 401
3. **Sync — missing param** — GET `/api/sync` (no bus_id) with valid key → expect 400
4. **Sync — valid** — GET `/api/sync?bus_id=<bus1_id>` with valid key → expect 200, check `stops.length === 24`, `polyline` present, `etas.length === 23`
5. **Events — TRIP_STARTED** — POST `/api/events` with valid key → expect 201
6. **Events — ARRIVED x3** — POST 3 ARRIVED events with timestamps → expect 201 each
7. **Events — TRIP_COMPLETED** — POST with valid key → expect 201
8. **Events — invalid event type** — POST with `event: 'FLYING'` → expect 400
9. **Cron run** — POST `/api/cron/run` → expect 200, `updatedPairs >= 1`
10. **ETA verify** — query DB directly, confirm `averageDurationSeconds` updated from 300 to actual measured value

---

## Verification Plan

### Automated Tests
```bash
# 1. Seed transit data first
node server/seeders/transitSeeder.js

# 2. Ensure server is running
npm run dev --prefix server

# 3. Run test script
node server/test-transit.js
```

### Manual DB Verification
```sql
-- Verify Stop table
SELECT COUNT(*) FROM stops;  -- expect 24

-- Verify BusAssignments
SELECT COUNT(*) FROM bus_assignments WHERE bus_id = '<bus1_id>';  -- expect 24
SELECT COUNT(*) FROM bus_assignments WHERE bus_id = '<bus2_id>';  -- expect 5

-- Verify baseline ETAs
SELECT AVG(average_duration_seconds) FROM historical_etas;  -- expect 300 initially

-- Verify EventLog ingestion
SELECT * FROM event_logs ORDER BY timestamp;

-- Verify Route polyline
SELECT id, name, polyline IS NOT NULL FROM routes;

-- Verify columns dropped
\d buses    -- should NOT have selected_stops
\d routes   -- should NOT have stops, SHOULD have polyline
```
