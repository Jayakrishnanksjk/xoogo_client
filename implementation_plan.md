# Implementation Plan: Edge-Computed Transit System Backend

We are implementing a lightweight, secure edge-computed transit system backend utilizing Node.js, Express, PostgreSQL, and Sequelize ORM.

## User Review Required

> [!IMPORTANT]
> - **API Authentication**: A static API key is expected in the request headers (`X-API-Key`) for both GET `/api/sync` and POST `/api/events` endpoints.
> - **Ordinary vs. Limited Stop Scheduling**: Buses assigned to the same route share the same master polyline. The specific stops a bus stops at (all 24 for ordinary, or a subset for limited stops) are defined by the `BusAssignment` mapping table. The GET `/api/sync` endpoint dynamically fetches only the assigned stops for a bus.
> - **Leaflet Compatibility**: The `RoutePolyline` model stores the path. The response from `/api/sync` will return both this polyline and the array of assigned stops (with `latitude`/`longitude` floats) so that the Leaflet client can easily draw markers and trace the path.

## Proposed Changes

---

### Database Models

#### [NEW] [Stop.js](file:///d:/Work/XOOGO/xoogo_client/server/models/Stop.js)
Stores static bus stop details.
- `id`: UUID (Primary Key)
- `name`: String
- `latitude`: Float
- `longitude`: Float

#### [NEW] [RoutePolyline.js](file:///d:/Work/XOOGO/xoogo_client/server/models/RoutePolyline.js)
Stores the master route polyline string.
- `id`: UUID (Primary Key)
- `name`: String
- `polyline`: Text (Encoded Polyline format, decodable by Leaflet/OSRM clients)

#### [NEW] [BusAssignment.js](file:///d:/Work/XOOGO/xoogo_client/server/models/BusAssignment.js)
Manages multi-tenant bus-to-stop assignments (determines ordinary vs. limited stop sequence).
- `id`: UUID (Primary Key)
- `busId`: UUID (Foreign Key to Bus)
- `stopId`: UUID (Foreign Key to Stop)
- `sequenceOrder`: Integer (Determines chronological stop order for the bus)

#### [NEW] [HistoricalEta.js](file:///d:/Work/XOOGO/xoogo_client/server/models/HistoricalEta.js)
Stores baseline and updated average travel times.
- `id`: UUID (Primary Key)
- `fromStopId`: UUID (Foreign Key to Stop)
- `toStopId`: UUID (Foreign Key to Stop)
- `averageDurationSeconds`: Integer (Average transit time in seconds)

#### [NEW] [EventLog.js](file:///d:/Work/XOOGO/xoogo_client/server/models/EventLog.js)
Stores status change updates ingested from buses.
- `id`: UUID (Primary Key)
- `busId`: UUID (Foreign Key to Bus)
- `event`: Enum (`TRIP_STARTED`, `ARRIVED`, `DETOUR_STARTED`, `SKIPPED`, `TRIP_COMPLETED`)
- `stopId`: UUID (Optional, for `ARRIVED`)
- `missedStopId`: UUID (Optional, for `SKIPPED`)
- `arrivedStopId`: UUID (Optional, for `SKIPPED`)
- `crossTrackError`: String (Optional, for `DETOUR_STARTED`)
- `timestamp`: Date (Calculated standard date/time from the payload time)
- `rawTimestamp`: String (Stored exact string from payload, e.g., "06:00 AM")

#### [MODIFY] [index.js](file:///d:/Work/XOOGO/xoogo_client/server/models/index.js)
Import and export new models and register Sequelize associations.

---

### Seeder

#### [NEW] [transitSeeder.js](file:///d:/Work/XOOGO/xoogo_client/server/seeders/transitSeeder.js)
Seeds 24 stops, a master route polyline, assignments for buses (e.g., Bus 1 has all 24 stops as an Ordinary Bus, Bus 2 has a subset of 5 stops as a Limited Bus), and baseline historical ETAs (5 minutes / 300 seconds between consecutive stops).

---

### Middleware & Routes

#### [NEW] [apiKeyAuth.js](file:///d:/Work/XOOGO/xoogo_client/server/middleware/apiKeyAuth.js)
Validates the `X-API-Key` header against `process.env.BUS_API_KEY`.

#### [NEW] [transit.js](file:///d:/Work/XOOGO/xoogo_client/server/routes/transit.js)
Implements:
1. **GET `/api/sync`**: Returns the polyline, sorted stops assigned to the bus, and historical ETAs.
2. **POST `/api/events`**: Ingests event logs.

#### [MODIFY] [app.js](file:///d:/Work/XOOGO/xoogo_client/server/app.js)
Mount the `/api/transit` (or new sync/event routes) under the API router.

---

### Background Jobs (Cron)

#### [NEW] [midnightCron.js](file:///d:/Work/XOOGO/xoogo_client/server/cron/midnightCron.js)
Runs nightly processing logic:
- Group events by `busId` and group chronologically.
- Group ARRIVED events between `TRIP_STARTED` and `TRIP_COMPLETED` for each trip.
- Measure actual durations, calculate the mean duration between each stop pair, and update `HistoricalEtas`.

---

## Verification Plan

### Automated Tests
- A standalone test script [test-transit.js](file:///d:/Work/XOOGO/xoogo_client/server/test-transit.js) that:
  1. Calls `/api/sync` (expects success with valid key, 401 with invalid key).
  2. Submits trip event sequences to `/api/events`.
  3. Executes the midnight aggregation function programmatically.
  4. Verifies the `HistoricalEtas` database updates.

### Manual Verification
- Verify table creations and schema in postgres using local queries.
