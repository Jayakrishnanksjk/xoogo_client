import express from 'express'
import { Schedule, ScheduleRoute, Route, Bus, BusSchedule } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// GET /api/schedules - List all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      include: [
        {
          model: ScheduleRoute, as: 'scheduleRoutes',
          include: [{ model: Route, as: 'route', attributes: ['id', 'name', 'code'] }]
        },
        { model: Bus, as: 'buses', attributes: ['id', 'regNumber'], through: { attributes: [] } }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(schedules)
  } catch (error) {
    console.error('List schedules error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/schedules/:id - Get a single schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id, {
      include: [
        {
          model: ScheduleRoute, as: 'scheduleRoutes',
          include: [{ model: Route, as: 'route', attributes: ['id', 'name', 'code'] }]
        },
        { model: Bus, as: 'buses', attributes: ['id', 'regNumber'], through: { attributes: [] } }
      ]
    })
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' })
    }
    res.json(schedule)
  } catch (error) {
    console.error('Get schedule error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/schedules - Create a new schedule
router.post('/', async (req, res) => {
  try {
    const { name, description, status, startTime, endTime } = req.body
    if (!name) {
      return res.status(400).json({ message: 'Schedule name is required.' })
    }
    const schedule = await Schedule.create({ name, description, status: status || 'active', startTime: startTime || null, endTime: endTime || null })
    res.status(201).json(schedule)
  } catch (error) {
    console.error('Create schedule error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// PATCH /api/schedules/:id - Update schedule
router.patch('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' })
    }
    const { name, description, status, startTime, endTime } = req.body
    if (name) schedule.name = name
    if (description !== undefined) schedule.description = description
    if (status) schedule.status = status
    if (startTime !== undefined) schedule.startTime = startTime
    if (endTime !== undefined) schedule.endTime = endTime
    await schedule.save()
    res.json(schedule)
  } catch (error) {
    console.error('Update schedule error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// DELETE /api/schedules/:id - Delete a schedule
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' })
    }
    await BusSchedule.destroy({ where: { scheduleId: schedule.id } })
    await schedule.destroy()
    res.json({ message: 'Schedule deleted successfully.' })
  } catch (error) {
    console.error('Delete schedule error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/schedules/:id/routes - Add a route to a schedule
router.post('/:id/routes', async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' })
    }
    const { routeId } = req.body
    if (!routeId) {
      return res.status(400).json({ message: 'routeId is required.' })
    }
    const route = await Route.findByPk(routeId)
    if (!route) {
      return res.status(404).json({ message: 'Route not found.' })
    }
    const existing = await ScheduleRoute.findOne({ where: { scheduleId: schedule.id, routeId } })
    if (existing) {
      return res.status(400).json({ message: 'Route is already in this schedule.' })
    }
    const lastRoute = await ScheduleRoute.findOne({
      where: { scheduleId: schedule.id },
      order: [['sequence_order', 'DESC']]
    })
    const nextOrder = lastRoute ? lastRoute.sequenceOrder + 1 : 1
    const scheduleRoute = await ScheduleRoute.create({
      scheduleId: schedule.id,
      routeId,
      sequenceOrder: nextOrder
    })
    const full = await ScheduleRoute.findByPk(scheduleRoute.id, {
      include: [{ model: Route, as: 'route', attributes: ['id', 'name', 'code'] }]
    })
    res.status(201).json(full)
  } catch (error) {
    console.error('Add route to schedule error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/schedules/:id/copy-routes - Copy all routes from another schedule
router.post('/:id/copy-routes', async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' })
    }
    const { sourceScheduleId } = req.body
    if (!sourceScheduleId) {
      return res.status(400).json({ message: 'sourceScheduleId is required.' })
    }
    if (sourceScheduleId === req.params.id) {
      return res.status(400).json({ message: 'Cannot copy routes from the same schedule.' })
    }
    const sourceSchedule = await Schedule.findByPk(sourceScheduleId)
    if (!sourceSchedule) {
      return res.status(404).json({ message: 'Source schedule not found.' })
    }
    const sourceRoutes = await ScheduleRoute.findAll({
      where: { scheduleId: sourceScheduleId },
      order: [['sequence_order', 'ASC']]
    })
    if (sourceRoutes.length === 0) {
      return res.status(400).json({ message: 'Source schedule has no routes to copy.' })
    }
    const existingRouteIds = new Set(
      (await ScheduleRoute.findAll({
        where: { scheduleId: schedule.id },
        attributes: ['routeId']
      })).map(sr => sr.routeId)
    )
    const lastRoute = await ScheduleRoute.findOne({
      where: { scheduleId: schedule.id },
      order: [['sequence_order', 'DESC']]
    })
    let nextOrder = lastRoute ? lastRoute.sequenceOrder + 1 : 1
    let copied = 0
    for (const sr of sourceRoutes) {
      if (!existingRouteIds.has(sr.routeId)) {
        await ScheduleRoute.create({
          scheduleId: schedule.id,
          routeId: sr.routeId,
          sequenceOrder: nextOrder++
        })
        copied++
      }
    }
    res.json({ message: `${copied} routes copied from "${sourceSchedule.name}".`, copied })
  } catch (error) {
    console.error('Copy routes error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// DELETE /api/schedules/:id/routes/:routeId - Remove a route from a schedule
router.delete('/:id/routes/:routeId', async (req, res) => {
  try {
    const scheduleRoute = await ScheduleRoute.findOne({
      where: { scheduleId: req.params.id, routeId: req.params.routeId }
    })
    if (!scheduleRoute) {
      return res.status(404).json({ message: 'Route not found in schedule.' })
    }
    await scheduleRoute.destroy()
    res.json({ message: 'Route removed from schedule successfully.' })
  } catch (error) {
    console.error('Remove route from schedule error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/schedules/:id/assign - Assign schedule to a bus (many-to-many)
router.post('/:id/assign', async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' })
    }
    const { busId } = req.body
    if (!busId) {
      return res.status(400).json({ message: 'busId is required.' })
    }
    const bus = await Bus.findByPk(busId)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    const existing = await BusSchedule.findOne({ where: { busId, scheduleId: schedule.id } })
    if (existing) {
      return res.status(400).json({ message: 'This bus is already assigned to this schedule.' })
    }
    await BusSchedule.create({ busId, scheduleId: schedule.id })
    const updated = await Schedule.findByPk(schedule.id, {
      include: [
        { model: ScheduleRoute, as: 'scheduleRoutes', include: [{ model: Route, as: 'route', attributes: ['id', 'name', 'code'] }] },
        { model: Bus, as: 'buses', attributes: ['id', 'regNumber'], through: { attributes: [] } }
      ]
    })
    res.json(updated)
  } catch (error) {
    console.error('Assign schedule to bus error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// DELETE /api/schedules/:id/assign/:busId - Unassign a specific bus from a schedule
router.delete('/:id/assign/:busId', async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' })
    }
    const deleted = await BusSchedule.destroy({
      where: { scheduleId: schedule.id, busId: req.params.busId }
    })
    if (!deleted) {
      return res.status(404).json({ message: 'Bus is not assigned to this schedule.' })
    }
    res.json({ message: 'Bus unassigned from schedule successfully.' })
  } catch (error) {
    console.error('Unassign schedule error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router