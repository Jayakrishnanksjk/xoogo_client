import express from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import { Route, Stop, sequelize } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

function parseTextFormat(text) {
  const routeMap = new Map()
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim())

  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim())
    if (lines.length < 2) continue

    const header = lines[0].trim()
    const name = header.replace(/^Route\s*/i, '').trim() || 'Unnamed Route'
    const code = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')

    const stops = []
    for (let i = 1; i < lines.length; i++) {
      const match = lines[i].match(/^\s*\d+[\.)]\s*(.+?)\s*[-–]\s*([\d.]+)\s*,\s*([\d.]+)/)
      if (match) {
        stops.push({
          name: match[1].trim(),
          latitude: parseFloat(match[2]),
          longitude: parseFloat(match[3]),
          sequence: stops.length + 1,
        })
      }
    }

    if (stops.length > 0) {
      routeMap.set(code, {
        name,
        code,
        estimatedDuration: null,
        distance: null,
        routeType: 'inbound',
        status: 'active',
        stops,
      })
    }
  }

  return routeMap
}

// POST /api/routes/import - Import routes from CSV or text format
router.post('/import', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' })
    }

    const content = req.file.buffer.toString().replace(/^\uFEFF/, '')
    const trimmed = content.trim()
    let routeMap

    // Detect format: if first non-empty line starts with "Route", treat as text format
    const firstLine = trimmed.split('\n').find(l => l.trim()) || ''
    if (/^Route\s/i.test(firstLine.trim())) {
      routeMap = parseTextFormat(trimmed)
    } else {
      const records = parse(trimmed, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })

      if (records.length === 0) {
        return res.status(400).json({ message: 'File is empty.' })
      }

      // Group records by route_code
      routeMap = new Map()
      for (const row of records) {
        const code = row.route_code?.trim()
        if (!code) continue

        if (!routeMap.has(code)) {
          routeMap.set(code, {
            name: row.route_name?.trim(),
            code,
            estimatedDuration: row.estimated_duration?.trim() || null,
            distance: row.distance ? parseFloat(row.distance) : null,
            routeType: row.route_type?.trim() || 'inbound',
            status: row.status?.trim() || 'active',
            stops: [],
          })
        }

        const routeData = routeMap.get(code)
        if (row.stop_name?.trim() && row.latitude && row.longitude) {
          routeData.stops.push({
            name: row.stop_name.trim(),
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            sequence: row.stop_sequence ? parseInt(row.stop_sequence, 10) : routeData.stops.length + 1,
          })
        }
      }
    }

    if (!routeMap || routeMap.size === 0) {
      return res.status(400).json({ message: 'No valid routes found in the file.' })
    }

    const errors = []
    const created = []

    for (const [code, data] of routeMap) {
      if (!data.name) {
        errors.push({ code, message: 'Route name is required.' })
        continue
      }

      const existing = await Route.findOne({ where: { code } })
      if (existing) {
        errors.push({ code, message: `Route code "${code}" already exists.` })
        continue
      }

      if (data.stops.length === 0) {
        errors.push({ code, message: 'At least one valid stop is required.' })
        continue
      }

      const t = await sequelize.transaction()
      try {
        const route = await Route.create({
          name: data.name,
          code: data.code,
          estimatedDuration: data.estimatedDuration,
          distance: data.distance,
          routeType: data.routeType,
          status: data.status,
        }, { transaction: t })

        data.stops.sort((a, b) => a.sequence - b.sequence)

        await Stop.bulkCreate(
          data.stops.map(s => ({
            name: s.name,
            latitude: s.latitude,
            longitude: s.longitude,
            sequenceOrder: s.sequence,
            routeId: route.id,
          })),
          { transaction: t }
        )

        await t.commit()
        created.push({ code, name: data.name, stops: data.stops.length })
      } catch (err) {
        await t.rollback()
        errors.push({ code, message: err.message })
      }
    }

    res.json({
      imported: created.length,
      total: routeMap.size,
      created,
      errors,
    })
  } catch (error) {
    console.error('Import routes error:', error)
    res.status(500).json({ message: 'Failed to parse file. Check the file format.' })
  }
})

// GET /api/routes - List all routes (authenticated users)
router.get('/', authenticate, async (req, res) => {
  try {
    const routes = await Route.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: Stop, as: 'stops', attributes: ['id', 'name', 'latitude', 'longitude', 'sequenceOrder'], order: [['sequenceOrder', 'ASC']] }]
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
      include: [{ model: Stop, as: 'stops', attributes: ['id', 'name', 'latitude', 'longitude', 'sequenceOrder'], order: [['sequenceOrder', 'ASC']] }]
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
