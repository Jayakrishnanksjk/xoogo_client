import { Router } from 'express'
import { Bus, Group, Route, Stop, Schedule, BusSchedule, ScheduleRoute } from '../models/index.js'
import BusApiKey from '../models/BusApiKey.js'

const router = Router()

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
    const bus = await Bus.findOne({
      where: { busId },
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        { model: Route, as: 'route', attributes: ['id', 'name', 'code'] },
      ]
    })
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    res.json({
      regNumber: bus.regNumber,
      busId: bus.busId,
      busType: bus.busType,
      status: bus.status,
      contactName: bus.contactName,
      contactNumber: bus.contactNumber,
      group: bus.group ? { id: bus.group.id, name: bus.group.name } : null,
      route: bus.route ? { id: bus.route.id, name: bus.route.name, code: bus.route.code } : null,
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
    const bus = await Bus.findOne({
      where: { busId },
      include: [{ model: Route, as: 'route', include: [{ model: Stop, as: 'stops' }] }]
    })
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    const route = bus.route
    if (!route) {
      return res.json({ route: null, message: 'No route assigned to this bus.' })
    }
    res.json({
      route: {
        id: route.id,
        name: route.name,
        code: route.code,
        stops: (route.stops || []).map(s => ({
          id: s.id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
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
    const bus = await Bus.findOne({
      where: { busId },
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        {
          model: Schedule, as: 'schedules',
          include: [{
            model: ScheduleRoute, as: 'scheduleRoutes',
            include: [{ model: Route, as: 'route', attributes: ['id', 'name', 'code'] }]
          }],
          through: { attributes: [] }
        },
      ]
    })
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    res.json({
      group: bus.group ? { id: bus.group.id, name: bus.group.name } : null,
      schedules: (bus.schedules || []).map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        route: s.scheduleRoutes?.[0]?.route || null,
      })),
    })
  } catch (error) {
    console.error('Public bus-schedule endpoint error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router