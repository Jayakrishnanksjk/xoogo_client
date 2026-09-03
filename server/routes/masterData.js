import express from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { State, District, Region, Stop, RouteStop, sequelize } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const indiaDataPath = path.resolve(__dirname, '../../src/india-states-districts.json')
let indiaData = null
try {
  indiaData = JSON.parse(fs.readFileSync(indiaDataPath, 'utf8'))
} catch (e) {
  console.error('Could not load india-states-districts.json:', e)
}

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// ── STATIC: States & Districts (from JSON) ─────────────────────────
router.get('/states', authenticate, async (req, res) => {
  try {
    if (!indiaData) return res.json([])
    // Format to match what the frontend expects (id and name)
    // using the string name as the ID so it saves properly in Stop.state if the frontend passes it
    const states = indiaData.states.map(s => ({
      id: s.name, // Using name as ID so the frontend passes the string name
      name: s.name,
      status: 'active'
    })).sort((a, b) => a.name.localeCompare(b.name))
    res.json(states)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/states', authenticate, async (req, res) => {
  try {
    const { name, status } = req.body
    const state = await State.create({ name, status })
    res.json(state)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── CRUD: Districts ─────────────────────────
router.get('/districts', authenticate, async (req, res) => {
  try {
    if (!indiaData) return res.json([])
    const districts = []
    indiaData.states.forEach(s => {
      s.districts.forEach(d => {
        districts.push({
          id: d.name, // Using name as ID so the frontend passes the string name
          name: d.name,
          state_id: s.name, // The state's name is its ID now
          state: { name: s.name },
          status: 'active'
        })
      })
    })
    districts.sort((a, b) => a.name.localeCompare(b.name))
    res.json(districts)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/districts', authenticate, async (req, res) => {
  try {
    const { name, state_id, status } = req.body
    const district = await District.create({ name, state_id, status })
    res.json(district)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── CRUD: Regions ─────────────────────────
router.get('/regions', authenticate, async (req, res) => {
  try {
    const regions = await Region.findAll({ order: [['name', 'ASC']] })
    res.json(regions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/regions', authenticate, async (req, res) => {
  try {
    const { name, status } = req.body
    const region = await Region.create({ name, status })
    res.json(region)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── CRUD: Stops ─────────────────────────
router.get('/stops', authenticate, async (req, res) => {
  try {
    const stops = await Stop.findAll({
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('routeStops.id')), 'assignedRoutesCount']
        ]
      },
      include: [
        { model: State, as: 'stateMaster', attributes: ['id', 'name'] },
        { model: District, as: 'districtMaster', attributes: ['id', 'name'] },
        { model: RouteStop, as: 'routeStops', attributes: [] }
      ],
      group: ['Stop.id', 'stateMaster.id', 'districtMaster.id'],
      order: [['name', 'ASC']],
      limit: 500, // Limit to prevent massive payload, add pagination later if needed
      subQuery: false,
    })
    res.json(stops)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/stops', authenticate, async (req, res) => {
  try {
    const { name, nameMl, latitude, longitude, state_id, district_id, region_id, status, description } = req.body
    if (!name) return res.status(400).json({ message: 'Stop name is required' })

    const stop = await Stop.create({
      name,
      nameMl,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      state: state_id || null, // save string name to state column
      district: district_id || null, // save string name to district column
      state_id: null, // Keep UUID columns null
      district_id: null,
      region_id: region_id || null,
      status: status || 'active',
      description
    })

    // Fetch with include to match the GET /stops format
    const newStop = await Stop.findByPk(stop.id, {
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('routeStops.id')), 'assignedRoutesCount']
        ]
      },
      include: [
        { model: State, as: 'stateMaster', attributes: ['id', 'name'] },
        { model: District, as: 'districtMaster', attributes: ['id', 'name'] },
        { model: RouteStop, as: 'routeStops', attributes: [] }
      ],
      group: ['Stop.id', 'stateMaster.id', 'districtMaster.id'],
    })

    res.json(newStop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/stops/:id', authenticate, async (req, res) => {
  try {
    const { name, nameMl, latitude, longitude, state_id, district_id, region_id, status, description } = req.body
    const stop = await Stop.findByPk(req.params.id)
    if (!stop) return res.status(404).json({ message: 'Stop not found.' })

    await stop.update({
      name: name || stop.name,
      nameMl: nameMl !== undefined ? nameMl : stop.nameMl,
      latitude: latitude !== undefined ? latitude : stop.latitude,
      longitude: longitude !== undefined ? longitude : stop.longitude,
      state: state_id !== undefined ? (state_id || null) : stop.state,
      district: district_id !== undefined ? (district_id || null) : stop.district,
      state_id: null, // Wipe old UUIDs if any
      district_id: null,
      region_id: region_id !== undefined ? (region_id || null) : stop.region_id,
      status: status || stop.status,
      description: description !== undefined ? description : stop.description,
    })
    
    // Fetch with include to return full object
    const updatedStop = await Stop.findByPk(req.params.id, {
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('routeStops.id')), 'assignedRoutesCount']
        ]
      },
      include: [
        { model: State, as: 'stateMaster', attributes: ['id', 'name'] },
        { model: District, as: 'districtMaster', attributes: ['id', 'name'] },
        { model: RouteStop, as: 'routeStops', attributes: [] }
      ],
      group: ['Stop.id', 'stateMaster.id', 'districtMaster.id'],
    })

    res.json(updatedStop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ── Combine Stops ─────────────────────────
router.post('/stops/combine', authenticate, async (req, res) => {
  try {
    const { primaryStopId, duplicateStopIds } = req.body
    if (!primaryStopId || !duplicateStopIds || duplicateStopIds.length === 0) {
      return res.status(400).json({ message: 'Primary stop and at least one duplicate stop required.' })
    }

    const t = await sequelize.transaction()
    try {
      // Find all route assignments for duplicate stops
      const routeAssignments = await RouteStop.findAll({
        where: { stop_id: duplicateStopIds },
        transaction: t
      })

      // Update route assignments to point to primary stop
      for (const assignment of routeAssignments) {
        // Check if primary stop is already in that route at that sequence
        const existing = await RouteStop.findOne({
          where: { route_id: assignment.route_id, stop_id: primaryStopId, sequenceOrder: assignment.sequenceOrder },
          transaction: t
        })
        
        if (!existing) {
          // It's safe to update
          await assignment.update({ stop_id: primaryStopId }, { transaction: t })
        } else {
          // Conflict: primary stop is already there. Just delete the duplicate's assignment.
          await assignment.destroy({ transaction: t })
        }
      }

      // Delete the duplicate stops
      await Stop.destroy({
        where: { id: duplicateStopIds },
        transaction: t
      })

      await t.commit()
      res.json({ message: 'Stops combined successfully.' })
    } catch (error) {
      await t.rollback()
      res.status(500).json({ message: error.message })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
