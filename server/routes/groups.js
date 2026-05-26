import express from 'express'
import { Group } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /api/groups - Get all active groups (authenticated users only)
router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    })
    res.json(groups)
  } catch (error) {
    console.error('List groups error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router
