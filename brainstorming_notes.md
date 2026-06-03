# Brainstorming Notes: Edge-Computed Transit System Backend

## 1. Project Goal & Overview
The goal is to build a lightweight, highly efficient, and secure backend to act as a "filing cabinet" and "message receiver" for an Edge-Computed Transit System. 
- **Target Edge Devices**: Android TVs installed on buses (1.5GB RAM, intermittent internet, local GPS, local ETA calculation).
- **Core Strategy**: Offload heavy math, live-tracking WebSockets, and real-time spatial calculations entirely to the edge device. The backend provides static configuration, ingests event logs, and refines historical ETAs overnight.

## 2. Leaflet Integration & Route Design
- The Leaflet map on the client side needs to draw the route path and mark stops.
- To facilitate this, the GET `/api/sync` payload will include:
  1. The **Master Route Polyline** (in encoded string format or GeoJSON format, easily decodable by Leaflet).
  2. The list of assigned stops containing `latitude`, `longitude`, `name`, and order sequence so Leaflet can draw marker pins.

## 3. Bus Types: Ordinary vs. Limited Stops
- Different buses (Ordinary vs. Limited/Express) run on the same route and share the same polyline.
- **Ordinary Bus**: Assigned all 24 stops in sequence.
- **Limited Stop Bus**: Assigned only a subset of the stops (e.g. 5 express stops) in sequence.
- This is resolved dynamically by query filters on the `BusAssignment` table during sync:
  - `GET /api/sync?bus_id=12` only returns the stops assigned to that specific `bus_id` in strict sequence, though it returns the same master polyline.

## 4. Key Constraints & Non-Goals
- **Anti-Pattern (No WebSockets)**: Do not build live-streaming GPS sockets or accept per-second coordinates.
- **Anti-Pattern (No Server-Side Map Matching)**: The backend will not calculate spatial geometries or determine if a bus is near a stop.
- **Anti-Pattern (No Real-Time Server ETAs)**: The server does not estimate live arrival times.

## 5. Database Schema Concept
- **Stops Table**: `id`, `name`, `latitude`, `longitude`, timestamps.
- **Route Polyline Table**: `id`, `polyline` (Encoded string or GeoJSON), timestamps.
- **Bus Assignment Table**: `id`, `bus_id`, `stop_id`, `sequence_order`. (Controls ordinary vs. limited stops per bus).
- **Historical ETA Table**: `id`, `from_stop_id`, `to_stop_id`, `average_duration_seconds`. (Pre-seeded with a baseline of 5 minutes/300 seconds).

## 6. API Endpoints
1. **GET `/api/sync`** (Morning Sync)
   - Headers: `X-API-Key: <static_shared_key>`
   - Query: `?bus_id=12`
   - Returns: Route polyline, chronologically sorted stops assigned to the bus, and average historical ETAs.
2. **POST `/api/events`** (Event Ingestion)
   - Headers: `X-API-Key: <static_shared_key>`
   - Body: `{"bus_id": 12, "event": "TRIP_STARTED" | "ARRIVED" | "DETOUR_STARTED" | "SKIPPED" | "TRIP_COMPLETED", ...}`
   - Action: Log directly to database table `bus_event_logs`.

## 7. Background Processing (The Midnight Cron Job)
- Runs at midnight daily.
- Finds all events grouped by `bus_id` and bounded by `TRIP_STARTED` and `TRIP_COMPLETED` for that day.
- Measures actual durations, calculates the mean duration between each stop pair, and updates `HistoricalEtas`.
