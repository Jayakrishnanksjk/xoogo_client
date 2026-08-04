import express from 'express'
import apiKeyAuth from '../middleware/apiKeyAuth.js'
import { Bus, Route, Stop, BusAssignment, HistoricalEta, EventLog, Schedule, BusSchedule, ScheduleRoute } from '../models/index.js'
import { Op } from 'sequelize'

const router = express.Router()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Find a bus by its UUID id OR its 6-char busId
async function resolveBus(busIdOrUuid) {
  if (UUID_RE.test(busIdOrUuid)) {
    const bus = await Bus.findByPk(busIdOrUuid)
    if (bus) return bus
  }
  return Bus.findOne({ where: { busId: busIdOrUuid } })
}

// GET /api/sync?bus_id=<uuid | busId>
router.get('/sync', apiKeyAuth, async (req, res) => {
  try {
    const { bus_id } = req.query

    if (!bus_id) {
      return res.status(400).json({ message: 'Missing bus_id query parameter' })
    }

    const bus = await resolveBus(bus_id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }

    const busUuid = bus.id

    const route = await Route.findByPk(bus.routeId)
    if (!route) {
      return res.status(404).json({ message: 'Route not found for bus' })
    }

    // Get assignments ordered sequentially
    const assignments = await BusAssignment.findAll({
      where: { busId: busUuid },
      order: [['sequenceOrder', 'ASC']],
      include: [{
        model: Stop,
        as: 'stop'
      }]
    })

    const stops = assignments.map(a => ({
      id: a.stop.id,
      name: a.stop.name,
      latitude: a.stop.latitude,
      longitude: a.stop.longitude,
      sequenceOrder: a.sequenceOrder
    }))

    // Get historical ETAs for consecutive stop pairs
    const etas = []
    for (let i = 0; i < stops.length - 1; i++) {
      const fromStopId = stops[i].id
      const toStopId = stops[i + 1].id
      const eta = await HistoricalEta.findOne({
        where: { fromStopId, toStopId }
      })
      if (eta) {
        etas.push({
          fromStopId,
          toStopId,
          averageDurationSeconds: eta.averageDurationSeconds
        })
      } else {
        etas.push({
          fromStopId,
          toStopId,
          averageDurationSeconds: 300 // default fallback
        })
      }
    }

    res.json({
      bus_id: busUuid,
      route: {
        id: route.id,
        name: route.name,
        polyline: route.polyline
      },
      stops,
      etas
    })

  } catch (error) {
    console.error('Error during sync:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/sync/full-timetable?bus_id=<uuid | busId>
// Single purpose-built call for on-bus devices: complete bus + schedule + route (with full stops) data.
router.get('/sync/full-timetable', apiKeyAuth, async (req, res) => {
  try {
    const { bus_id } = req.query

    if (!bus_id) {
      return res.status(400).json({ message: 'Missing bus_id query parameter' })
    }

    const bus = await resolveBus(bus_id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }

    const busUuid = bus.id

    const schedules = await Schedule.findAll({
      where: { status: 'active' },
      include: [
        {
          model: Bus,
          as: 'buses',
          where: { id: busUuid },
          through: { attributes: [] },
          attributes: [],
        },
        {
          model: ScheduleRoute,
          as: 'scheduleRoutes',
          required: true,
          include: [{
            model: Route,
            as: 'route',
            required: true,
            include: [{
              model: Stop,
              as: 'stops',
              attributes: ['id', 'name', 'latitude', 'longitude'],
              order: [['created_at', 'ASC']],
            }],
          }],
        },
      ],
      order: [['startTime', 'ASC']],
    })

    res.json({
      bus_id: busUuid,
      bus: {
        id: busUuid,
        busId: bus.busId,
        regNumber: bus.regNumber,
        busType: bus.busType,
        status: bus.status,
        contactName: bus.contactName,
        contactNumber: bus.contactNumber,
      },
      schedules: schedules.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        routes: (s.scheduleRoutes || [])
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
          .map(sr => {
            const r = sr.route
            return {
              id: r.id,
              name: r.name,
              code: r.code,
              routeType: r.routeType,
              polyline: r.polyline,
              stops: (r.stops || []).map(st => ({
                id: st.id,
                name: st.name,
                latitude: st.latitude,
                longitude: st.longitude,
              })),
            }
          }),
      })),
    })

  } catch (error) {
    console.error('Error during full timetable sync:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/events
router.post('/events', apiKeyAuth, async (req, res) => {
  try {
    const {
      bus_id,
      event,
      stop_id,
      missed_stop_id,
      arrived_stop_id,
      cross_track_error,
      timestamp,
      raw_timestamp
    } = req.body

    if (!bus_id || !event || !timestamp) {
      return res.status(400).json({ message: 'Missing required fields: bus_id, event, and timestamp are required' })
    }

    const bus = await resolveBus(bus_id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }

    const allowedEvents = ['TRIP_STARTED', 'ARRIVED', 'DETOUR_STARTED', 'SKIPPED', 'TRIP_COMPLETED']
    if (!allowedEvents.includes(event)) {
      return res.status(400).json({ message: 'Invalid event type' })
    }

    const eventLog = await EventLog.create({
      busId: bus.id,
      event,
      stopId: stop_id || null,
      missedStopId: missed_stop_id || null,
      arrivedStopId: arrived_stop_id || null,
      crossTrackError: cross_track_error || null,
      timestamp: new Date(timestamp),
      rawTimestamp: raw_timestamp || null
    })

    res.status(201).json({ message: 'Event logged', id: eventLog.id })

  } catch (error) {
    console.error('Error logging event:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/cron/run
router.post('/cron/run', apiKeyAuth, async (req, res) => {
  try {
    // 1. Fetch all events today (in chronological order)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const events = await EventLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: todayStart
        }
      },
      order: [['timestamp', 'ASC']]
    })

    // Group events by busId
    const eventsByBus = {}
    events.forEach(e => {
      if (!eventsByBus[e.busId]) {
        eventsByBus[e.busId] = []
      }
      eventsByBus[e.busId].push(e)
    })

    const durations = {} // key: 'fromStopId->toStopId', value: [durations]

    // 2. Extract trips and calculate segment durations
    for (const busId in eventsByBus) {
      const busEvents = eventsByBus[busId]
      let inTrip = false
      let lastArrivedStopId = null
      let lastArrivedTime = null

      for (const e of busEvents) {
        if (e.event === 'TRIP_STARTED') {
          inTrip = true
          lastArrivedStopId = null
          lastArrivedTime = null
        } else if (e.event === 'TRIP_COMPLETED') {
          inTrip = false
          lastArrivedStopId = null
          lastArrivedTime = null
        } else if (e.event === 'ARRIVED' && inTrip) {
          if (lastArrivedStopId && lastArrivedTime) {
            const durationSec = Math.round((new Date(e.timestamp) - new Date(lastArrivedTime)) / 1000)
            if (durationSec > 0) {
              const pairKey = `${lastArrivedStopId}->${e.stopId}`
              if (!durations[pairKey]) {
                durations[pairKey] = []
              }
              durations[pairKey].push(durationSec)
            }
          }
          lastArrivedStopId = e.stopId
          lastArrivedTime = e.timestamp
        }
      }
    }

    // 3. Compute averages and update HistoricalEta
    let updatedPairs = 0
    for (const pairKey in durations) {
      const [fromStopId, toStopId] = pairKey.split('->')
      const times = durations[pairKey]
      const avgDuration = Math.round(times.reduce((sum, val) => sum + val, 0) / times.length)

      // Find or create HistoricalEta record
      const [etaRecord] = await HistoricalEta.findOrCreate({
        where: { fromStopId, toStopId },
        defaults: { averageDurationSeconds: avgDuration }
      })

      if (etaRecord.averageDurationSeconds !== avgDuration) {
        etaRecord.averageDurationSeconds = avgDuration
        await etaRecord.save()
      }
      updatedPairs++
    }

    res.json({ message: 'ETA aggregation complete', updatedPairs })

  } catch (error) {
    console.error('Error running ETA aggregation:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
