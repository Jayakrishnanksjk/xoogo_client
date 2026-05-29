import express from 'express'
import { Bus, Group, Route } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

// GET /api/buses - Get all buses (can filter by group_id or route_id)
router.get('/', async (req, res) => {
  try {
    const { group_id, route_id } = req.query
    const whereClause = {}

    if (group_id) whereClause.groupId = group_id
    if (route_id) whereClause.routeId = route_id

    const buses = await Bus.findAll({
      where: whereClause,
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        { model: Route, as: 'route', attributes: ['id', 'name', 'stops'] }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json(buses)
  } catch (error) {
    console.error('List buses error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/buses - Create a new bus
router.post('/', async (req, res) => {
  try {
    const {
      regNumber,
      groupId,
      simNumber,
      busType,
      contactName,
      contactNumber,
      chassisNumber,
      model,
      routeId,
      selectedStops
    } = req.body

    if (!regNumber || !groupId || !simNumber || !busType || !contactName || !contactNumber) {
      return res.status(400).json({ message: 'Required fields are missing.' })
    }

    // Verify registration number is unique
    const existing = await Bus.findOne({ where: { regNumber } })
    if (existing) {
      return res.status(400).json({ message: 'A bus with this registration number already exists.' })
    }

    // Verify group exists
    const group = await Group.findByPk(groupId)
    if (!group) {
      return res.status(400).json({ message: 'Assigned group not found.' })
    }

    // Verify route exists if provided
    if (routeId) {
      const route = await Route.findByPk(routeId)
      if (!route) {
        return res.status(400).json({ message: 'Assigned route not found.' })
      }
    }

    const bus = await Bus.create({
      regNumber,
      groupId,
      simNumber,
      busType,
      contactName,
      contactNumber,
      chassisNumber: chassisNumber || null,
      model: model || null,
      routeId: routeId || null,
      selectedStops: selectedStops || null,
      status: 'offline', // default
    })

    const fullBus = await Bus.findByPk(bus.id, {
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        { model: Route, as: 'route', attributes: ['id', 'name', 'stops'] }
      ]
    })

    res.status(201).json(fullBus)
  } catch (error) {
    console.error('Create bus error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/buses/:id - Get a bus by ID
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id, {
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        { model: Route, as: 'route', attributes: ['id', 'name', 'stops'] }
      ]
    })
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    res.json(bus)
  } catch (error) {
    console.error('Get bus error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// PATCH /api/buses/:id - Update a bus
router.patch('/:id', async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }

    const {
      regNumber,
      groupId,
      simNumber,
      busType,
      contactName,
      contactNumber,
      chassisNumber,
      model,
      routeId,
      selectedStops,
      status
    } = req.body

    if (regNumber && regNumber !== bus.regNumber) {
      const existing = await Bus.findOne({ where: { regNumber } })
      if (existing) {
        return res.status(400).json({ message: 'A bus with this registration number already exists.' })
      }
      bus.regNumber = regNumber
    }

    if (groupId) {
      const group = await Group.findByPk(groupId)
      if (!group) {
        return res.status(400).json({ message: 'Assigned group not found.' })
      }
      bus.groupId = groupId
    }

    if (routeId) {
      const route = await Route.findByPk(routeId)
      if (!route) {
        return res.status(400).json({ message: 'Assigned route not found.' })
      }
      bus.routeId = routeId
    } else if (routeId === null) {
      bus.routeId = null
    }

    if (simNumber) bus.simNumber = simNumber
    if (busType) bus.busType = busType
    if (contactName) bus.contactName = contactName
    if (contactNumber) bus.contactNumber = contactNumber
    if (chassisNumber !== undefined) bus.chassisNumber = chassisNumber
    if (model !== undefined) bus.model = model
    if (selectedStops !== undefined) bus.selectedStops = selectedStops
    if (status) bus.status = status

    await bus.save()

    const fullBus = await Bus.findByPk(bus.id, {
      include: [
        { model: Group, as: 'group', attributes: ['id', 'name'] },
        { model: Route, as: 'route', attributes: ['id', 'name', 'stops'] }
      ]
    })

    res.json(fullBus)
  } catch (error) {
    console.error('Update bus error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// DELETE /api/buses/:id - Delete a bus
router.delete('/:id', async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    await bus.destroy()
    res.json({ success: true, message: 'Bus deleted successfully.' })
  } catch (error) {
    console.error('Delete bus error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router
