import { Router } from 'express'
import { Bus, Group, Route, Stop, Schedule, BusSchedule, ScheduleRoute } from '../models/index.js'
import BusApiKey from '../models/BusApiKey.js'

const router = Router()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveBus(busIdOrUuid) {
  if (UUID_RE.test(busIdOrUuid)) {
    const bus = await Bus.findByPk(busIdOrUuid)
    if (bus) return bus
  }
  return Bus.findOne({ where: { busId: busIdOrUuid } })
}

async function authenticateApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'API key required. Use Authorization: Bearer <key>' })
    }
    const token = authHeader.split(' ')[1]
    const apiKey = await BusApiKey.findOne({ where: { key: token, status: 'active' } })
    if (!apiKey) {
      return res.status(401).json({ message: 'Invalid or revoked API key.' })
    }
    apiKey.lastUsedAt = new Date()
    await apiKey.save()
    req.apiKey = apiKey
    next()
  } catch (error) {
    console.error('API key auth error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
}

router.post('/bus', authenticateApiKey, async (req, res) => {
  try {
    const { busId } = req.body
    if (!busId) {
      return res.status(400).json({ message: 'busId is required.' })
    }
    const bus = await resolveBus(busId)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    const fullBus = await Bus.findByPk(bus.id, {
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        { model: Route, as: 'route', attributes: ['id', 'name', 'code'] },
      ]
    })
    res.json({
      regNumber: fullBus.regNumber,
      busId: fullBus.busId,
      busType: fullBus.busType,
      status: fullBus.status,
      contactName: fullBus.contactName,
      contactNumber: fullBus.contactNumber,
      group: fullBus.group ? { id: fullBus.group.id, name: fullBus.group.name } : null,
      route: fullBus.route ? { id: fullBus.route.id, name: fullBus.route.name, code: fullBus.route.code } : null,
    })
  } catch (error) {
    console.error('Public bus endpoint error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.post('/bus-routes', authenticateApiKey, async (req, res) => {
  try {
    const { busId } = req.body
    if (!busId) {
      return res.status(400).json({ message: 'busId is required.' })
    }
    const bus = await resolveBus(busId)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }

    const fullBus = await Bus.findByPk(bus.id, {
      include: [
        { model: Route, as: 'route', include: [{ model: Stop, as: 'stops' }] },
        {
          model: Schedule, as: 'schedules',
          include: [{
            model: ScheduleRoute, as: 'scheduleRoutes',
            include: [{ model: Route, as: 'route', include: [{ model: Stop, as: 'stops' }] }]
          }],
          through: { attributes: [] }
        },
      ]
    })

    let route = fullBus.route
    if (!route) {
      const scheduleRoute = fullBus.schedules?.[0]?.scheduleRoutes?.[0]
      if (scheduleRoute?.route) {
        route = scheduleRoute.route
      }
    }

    if (!route) {
      return res.json({ route: null, message: 'No route assigned to this bus.' })
    }
    res.json({
      route: {
        id: route.id,
        name: route.name,
        code: route.code,
        stops: (route.stops || [])
          .slice()
          .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
          .map(s => ({
            id: s.id,
            name: s.name,
            name_ml: s.nameMl,
            latitude: s.latitude,
            longitude: s.longitude,
            sequenceOrder: s.sequenceOrder,
          })),
      }
    })
  } catch (error) {
    console.error('Public bus-routes endpoint error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.post('/bus-schedule', authenticateApiKey, async (req, res) => {
  try {
    const { busId } = req.body
    if (!busId) {
      return res.status(400).json({ message: 'busId is required.' })
    }
    const bus = await resolveBus(busId)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    const fullBus = await Bus.findByPk(bus.id, {
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        {
          model: Schedule, as: 'schedules',
          include: [{
            model: ScheduleRoute, as: 'scheduleRoutes',
            include: [{
              model: Route, as: 'route',
              include: [{ model: Stop, as: 'stops', attributes: ['id', 'name', 'nameMl', 'latitude', 'longitude', 'sequenceOrder'] }]
            }]
          }],
          through: { attributes: [] }
        },
      ]
    })
    res.json({
      group: fullBus.group ? { id: fullBus.group.id, name: fullBus.group.name } : null,
      schedules: (fullBus.schedules || []).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        route: (() => {
          const r = s.scheduleRoutes?.[0]?.route
          if (!r) return null
          return {
            id: r.id,
            name: r.name,
            code: r.code,
            stops: (r.stops || [])
              .slice()
              .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
              .map(st => ({
                id: st.id,
                name: st.name,
                name_ml: st.nameMl,
                latitude: st.latitude,
                longitude: st.longitude,
                sequenceOrder: st.sequenceOrder,
              })),
          }
        })(),
      })),
    })
  } catch (error) {
    console.error('Public bus-schedule endpoint error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router