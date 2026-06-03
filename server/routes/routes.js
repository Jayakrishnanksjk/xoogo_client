import express from 'express'
import { Route, Stop } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /api/routes - List all routes (authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const routes = await Route.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: Stop, as: 'stops', attributes: ['id', 'name', 'latitude', 'longitude'] }]
    })
    res.json(routes)
  } catch (error) {
    console.error('List routes error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/routes/:id - Get specific route
router.get('/:id', authenticate, async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id, {
      include: [{ model: Stop, as: 'stops', attributes: ['id', 'name', 'latitude', 'longitude'] }]
    })
    if (!route) {
      return res.status(404).json({ message: 'Route not found.' })
    }
    res.json(route)
  } catch (error) {
    console.error('Get route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/routes - Create route
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, estimatedDuration, distance, routeType, status } = req.body

    // Check unique code
    const existing = await Route.findOne({ where: { code } })
    if (existing) {
      return res.status(400).json({ message: 'Route code must be unique.' })
    }

    const route = await Route.create({
      name,
      code,
      estimatedDuration,
      distance,
      routeType,
      status: status || 'active'
    })
    res.status(201).json(route)
  } catch (error) {
    console.error('Create route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// PATCH /api/routes/:id - Update route
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name, code, estimatedDuration, distance, routeType, status } = req.body
    const route = await Route.findByPk(req.params.id)
    if (!route) {
      return res.status(404).json({ message: 'Route not found.' })
    }

    if (code && code !== route.code) {
      const existing = await Route.findOne({ where: { code } })
      if (existing) {
        return res.status(400).json({ message: 'Route code must be unique.' })
      }
    }

    await route.update({
      name,
      code,
      estimatedDuration,
      distance,
      routeType,
      status
    })
    res.json(route)
  } catch (error) {
    console.error('Update route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// DELETE /api/routes/:id - Delete route
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id)
    if (!route) {
      return res.status(404).json({ message: 'Route not found.' })
    }
    await route.destroy()
    res.json({ message: 'Route deleted successfully.' })
  } catch (error) {
    console.error('Delete route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router
