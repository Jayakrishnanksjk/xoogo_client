import express from 'express'
import { Op } from 'sequelize'
import { Stop, RouteStop, sequelize } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /api/stops/search?q=aluva&limit=10
router.get('/search', authenticate, async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 1) return res.json([])

    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)
    const lowerQ = q.toLowerCase()

    const stops = await Stop.findAll({
      attributes: [
        'id', 'name', 'nameMl', 'latitude', 'longitude', 'district', 'state',
        [sequelize.fn('COUNT', sequelize.col('routeStops.id')), 'usageCount'],
      ],
      include: [{
        model: RouteStop,
        as: 'routeStops',
        attributes: [],
        required: false,
      }],
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('Stop.name'))),
        { [Op.like]: `${lowerQ}%` }
      ),
      group: ['Stop.id'],
      order: [
        // Exact match first — use fn-based comparison for safety
        [sequelize.literal(`CASE WHEN LOWER(TRIM("Stop"."name")) = LOWER(${sequelize.escape(lowerQ)}) THEN 0 ELSE 1 END`), 'ASC'],
        ['name', 'ASC'],
      ],
      limit,
      subQuery: false,
    })

    const result = stops.map(s => {
      const plain = s.toJSON()
      return {
        id: plain.id,
        name: plain.name,
        nameMl: plain.nameMl || plain.name_ml || null,
        name_ml: plain.nameMl || plain.name_ml || null,
        latitude: plain.latitude,
        longitude: plain.longitude,
        district: plain.district,
        state: plain.state,
        usageCount: parseInt(plain.usageCount, 10) || 0,
      }
    })

    res.json(result)
  } catch (error) {
    console.error('Search stops error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router
