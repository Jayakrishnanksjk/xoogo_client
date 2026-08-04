import dotenv from 'dotenv'
import { Bus, Stop, BusAssignment, HistoricalEta, EventLog } from './models/index.js'

dotenv.config()

const BASE_URL = 'http://localhost:5000/api'
const API_KEY = process.env.BUS_API_KEY || 'default_bus_key'

async function runTests() {
  console.log('🚀 Running Transit API tests...')

  // Get buses and stops from DB directly to use IDs
  const buses = await Bus.findAll({ limit: 2 })
  if (buses.length < 2) {
    console.error('Error: Please run seeder first (node server/seeders/transitSeeder.js)')
    process.exit(1)
  }

  const bus1 = buses[0]
  const bus2 = buses[1]

  const stops = await Stop.findAll({ order: [['latitude', 'ASC']] })
  if (stops.length < 24) {
    console.error('Error: Insufficient stops in DB. Run the seeder first.')
    process.exit(1)
  }

  // Test 1: GET /api/sync with no key
  try {
    const res = await fetch(`${BASE_URL}/sync?bus_id=${bus1.id}`)
    if (res.status !== 401) throw new Error(`Test 1 Failed: Expected 401, got ${res.status}`)
    console.log('✅ Test 1: GET /sync with no API key rejected with 401')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 2: GET /api/sync with invalid key
  try {
    const res = await fetch(`${BASE_URL}/sync?bus_id=${bus1.id}`, {
      headers: { 'X-API-Key': 'wrong-key' }
    })
    if (res.status !== 401) throw new Error(`Test 2 Failed: Expected 401, got ${res.status}`)
    console.log('✅ Test 2: GET /sync with invalid API key rejected with 401')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 3: GET /api/sync with missing param
  try {
    const res = await fetch(`${BASE_URL}/sync`, {
      headers: { 'X-API-Key': API_KEY }
    })
    if (res.status !== 400) throw new Error(`Test 3 Failed: Expected 400, got ${res.status}`)
    console.log('✅ Test 3: GET /sync with missing bus_id rejected with 400')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 4: GET /api/sync valid (Ordinary Bus)
  try {
    const res = await fetch(`${BASE_URL}/sync?bus_id=${bus1.id}`, {
      headers: { 'X-API-Key': API_KEY }
    })
    if (res.status !== 200) throw new Error(`Test 4 Failed: Expected 200, got ${res.status}`)
    const data = await res.json()
    if (data.stops.length !== 24) throw new Error(`Expected 24 stops, got ${data.stops.length}`)
    if (data.etas.length !== 23) throw new Error(`Expected 23 ETAs, got ${data.etas.length}`)
    console.log('✅ Test 4: GET /sync for ordinary bus successfully returned 24 stops and 23 ETAs')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 5: GET /api/sync valid (Limited Bus)
  try {
    const res = await fetch(`${BASE_URL}/sync?bus_id=${bus2.id}`, {
      headers: { 'X-API-Key': API_KEY }
    })
    if (res.status !== 200) throw new Error(`Test 5 Failed: Expected 200, got ${res.status}`)
    const data = await res.json()
    if (data.stops.length !== 5) throw new Error(`Expected 5 stops, got ${data.stops.length}`)
    console.log('✅ Test 5: GET /sync for limited bus successfully returned 5 stops')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 6: POST /api/events TRIP_STARTED
  let now = new Date()
  try {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: bus1.id,
        event: 'TRIP_STARTED',
        timestamp: now.toISOString()
      })
    })
    if (res.status !== 201) throw new Error(`Test 6 Failed: Expected 201, got ${res.status}`)
    console.log('✅ Test 6: POST /events logged TRIP_STARTED')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 7: POST /api/events ARRIVED at Stop 0, then Stop 1 after 400 seconds
  const stop0 = stops[0]
  const stop1 = stops[1]
  const stop2 = stops[2]

  try {
    const t0 = new Date(now.getTime() + 1000 * 60)
    const t1 = new Date(t0.getTime() + 1000 * 400) // 400s duration
    const t2 = new Date(t1.getTime() + 1000 * 200) // 200s duration

    await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bus_id: bus1.id, event: 'ARRIVED', stop_id: stop0.id, timestamp: t0.toISOString() })
    })

    await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bus_id: bus1.id, event: 'ARRIVED', stop_id: stop1.id, timestamp: t1.toISOString() })
    })

    await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bus_id: bus1.id, event: 'ARRIVED', stop_id: stop2.id, timestamp: t2.toISOString() })
    })

    // TRIP_COMPLETED
    const tComp = new Date(t2.getTime() + 1000 * 60)
    await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bus_id: bus1.id, event: 'TRIP_COMPLETED', timestamp: tComp.toISOString() })
    })

    console.log('✅ Test 7: POST /events logged consecutive ARRIVED events and TRIP_COMPLETED')
  } catch (err) {
    console.error('Test 7 Failed:', err.message)
    process.exit(1)
  }

  // Test 8: POST /api/events with invalid event type
  try {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: bus1.id,
        event: 'FLYING',
        timestamp: now.toISOString()
      })
    })
    if (res.status !== 400) throw new Error(`Test 8 Failed: Expected 400, got ${res.status}`)
    console.log('✅ Test 8: POST /events rejected invalid event type with 400')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 9: POST /api/cron/run
  try {
    const res = await fetch(`${BASE_URL}/cron/run`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY }
    })
    if (res.status !== 200) throw new Error(`Test 9 Failed: Expected 200, got ${res.status}`)
    const data = await res.json()
    if (data.updatedPairs < 1) throw new Error(`Expected at least 1 updated pair, got ${data.updatedPairs}`)
    console.log(`✅ Test 9: POST /cron/run ran successfully, updated ${data.updatedPairs} pairs`)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 10: Verify ETA updates in DB
  try {
    const eta1 = await HistoricalEta.findOne({ where: { fromStopId: stop0.id, toStopId: stop1.id } })
    const eta2 = await HistoricalEta.findOne({ where: { fromStopId: stop1.id, toStopId: stop2.id } })

    if (!eta1 || eta1.averageDurationSeconds !== 400) {
      throw new Error(`Test 10 Failed: Expected eta1 average duration to be 400, got ${eta1?.averageDurationSeconds}`)
    }
    if (!eta2 || eta2.averageDurationSeconds !== 200) {
      throw new Error(`Test 10 Failed: Expected eta2 average duration to be 200, got ${eta2?.averageDurationSeconds}`)
    }
    console.log('✅ Test 10: Database verified with actual computed average travel durations!')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 11: GET /api/sync/full-timetable with no key
  try {
    const res = await fetch(`${BASE_URL}/sync/full-timetable?bus_id=${bus1.id}`)
    if (res.status !== 401) throw new Error(`Test 11 Failed: Expected 401, got ${res.status}`)
    console.log('✅ Test 11: GET /sync/full-timetable with no API key rejected with 401')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  // Test 12: GET /api/sync/full-timetable valid (bus + schedules + routes + full stops in one call)
  try {
    const res = await fetch(`${BASE_URL}/sync/full-timetable?bus_id=${bus1.id}`, {
      headers: { 'X-API-Key': API_KEY }
    })
    if (res.status !== 200) throw new Error(`Test 12 Failed: Expected 200, got ${res.status}`)
    const data = await res.json()
    if (!data.bus_id || !data.bus) throw new Error('Test 12 Failed: Missing bus_id or bus details')
    if (!Array.isArray(data.schedules) || data.schedules.length < 1) throw new Error('Test 12 Failed: No schedules returned')
    const sched = data.schedules[0]
    if (!Array.isArray(sched.routes) || sched.routes.length < 1) throw new Error('Test 12 Failed: Schedule has no routes')
    if (!Array.isArray(sched.routes[0].stops) || sched.routes[0].stops.length < 1) throw new Error('Test 12 Failed: Route has no stops')
    console.log(`✅ Test 12: GET /sync/full-timetable returned bus + ${data.schedules.length} schedule(s) with full stops in one call`)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  console.log('🎉 All Tests Passed Successfully!')
  process.exit(0)
}

runTests()
