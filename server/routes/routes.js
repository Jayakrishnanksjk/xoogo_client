import express from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import { Op } from 'sequelize'
import { Route, Stop, RouteStop, sequelize } from '../models/index.js'
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
      const match = lines[i].match(/^\s*\d+[\.)]\s*(.+?)\s*[-–]\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*\|\s*(.*))?\s*$/)
      if (match) {
        stops.push({
          name: match[1].trim(),
          name_ml: match[4]?.trim() || null,
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

async function findOrCreateStop(name, nameMl, latitude, longitude, transaction) {
  const trimmed = (name || '').trim()
  if (!trimmed) return null
  const existing = await Stop.findOne({
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmed.toLowerCase()),
    transaction,
  })
  if (existing) {
    let needSave = false
    if (nameMl && !existing.nameMl) { existing.nameMl = nameMl; needSave = true }
    if (needSave) await existing.save({ transaction })
    return existing
  }
  return await Stop.create({
    name: trimmed,
    nameMl: nameMl || null,
    latitude,
    longitude,
    routeId: null,
    sequenceOrder: null,
  }, { transaction })
}

function formatStops(routePlain) {
  if (routePlain.stops && routePlain.stops.length > 0) {
    const mapped = routePlain.stops.map(s => {
      const seq = s.RouteStop ? s.RouteStop.sequenceOrder : (s.sequenceOrder ?? 0)
      return {
        id: s.id,
        name: s.name,
        name_ml: s.name_ml ?? s.nameMl ?? null,
        nameMl: s.nameMl ?? s.name_ml ?? null,
        latitude: s.latitude,
        longitude: s.longitude,
        lat: s.latitude,
        lng: s.longitude,
        sequenceOrder: seq,
      }
    }).sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
    routePlain.stops = mapped
  } else if (routePlain.legacyStops && routePlain.legacyStops.length > 0) {
    const mapped = routePlain.legacyStops.map(s => ({
      id: s.id,
      name: s.name,
      name_ml: s.name_ml ?? s.nameMl ?? null,
      nameMl: s.nameMl ?? s.name_ml ?? null,
      latitude: s.latitude,
      longitude: s.longitude,
      lat: s.latitude,
      lng: s.longitude,
      sequenceOrder: s.sequenceOrder ?? 0,
    })).sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
    routePlain.stops = mapped
    delete routePlain.legacyStops
  } else {
    routePlain.stops = routePlain.stops || []
    if (routePlain.legacyStops) delete routePlain.legacyStops
  }
  if (routePlain.legacyStops) delete routePlain.legacyStops
  return routePlain
}

function routeInclude() {
  return [
    {
      model: Stop,
      as: 'stops',
      attributes: ['id', 'name', 'name_ml', 'latitude', 'longitude'],
      through: { attributes: ['sequenceOrder'] },
    },
    {
      model: Stop,
      as: 'legacyStops',
      attributes: ['id', 'name', 'name_ml', 'latitude', 'longitude', 'sequenceOrder'],
    },
  ]
}

async function createRouteStops(routeId, stopsData, transaction) {
  const entries = []
  for (let idx = 0; idx < stopsData.length; idx++) {
    const s = stopsData[idx]
    const lat = s.lat ?? s.latitude
    const lng = s.lng ?? s.longitude
    const stop = await findOrCreateStop(s.name || '', s.name_ml ?? s.nameMl ?? null, lat, lng, transaction)
    if (!stop) continue
    entries.push({ routeId, stopId: stop.id, sequenceOrder: idx + 1 })
  }
  if (entries.length > 0) {
    await RouteStop.bulkCreate(entries, { transaction })
  }
  return entries
}

router.post('/import', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' })
    const content = req.file.buffer.toString().replace(/^\uFEFF/, '')
    const trimmed = content.trim()
    let routeMap
    const firstLine = trimmed.split('\n').find(l => l.trim()) || ''
    if (/^Route\s/i.test(firstLine.trim())) {
      routeMap = parseTextFormat(trimmed)
    } else {
      const records = parse(trimmed, { columns: true, skip_empty_lines: true, trim: true })
      if (records.length === 0) return res.status(400).json({ message: 'File is empty.' })
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
          const rawSeq = row.stop_sequence ? parseInt(row.stop_sequence, 10) : null
          routeData.stops.push({
            name: row.stop_name.trim(),
            name_ml: row.stop_name_ml?.trim() || null,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            sequence: rawSeq,
            csvIndex: routeData.stops.length + 1,
          })
        }
      }
    }
    if (!routeMap || routeMap.size === 0) return res.status(400).json({ message: 'No valid routes found in the file.' })
    const errors = []
    const created = []
    for (const [code, data] of routeMap) {
      if (!data.name) { errors.push({ code, message: 'Route name is required.' }); continue }
      const existing = await Route.findOne({ where: { code } })
      if (existing) { errors.push({ code, message: `Route code "${code}" already exists.` }); continue }
      if (data.stops.length === 0) { errors.push({ code, message: 'At least one valid stop is required.' }); continue }
      const t = await sequelize.transaction()
      try {
        const route = await Route.create({
          name: data.name, code: data.code, estimatedDuration: data.estimatedDuration,
          distance: data.distance, routeType: data.routeType, status: data.status,
        }, { transaction: t })
        data.stops.sort((a, b) => {
          if (a.sequence != null && b.sequence != null && !isNaN(a.sequence) && !isNaN(b.sequence)) return a.sequence - b.sequence
          return a.csvIndex - b.csvIndex
        })
        await createRouteStops(route.id, data.stops, t)
        await t.commit()
        created.push({ code, name: data.name, stops: data.stops.length })
      } catch (err) {
        await t.rollback()
        errors.push({ code, message: err.message })
      }
    }
    res.json({ imported: created.length, total: routeMap.size, created, errors })
  } catch (error) {
    console.error('Import routes error:', error)
    res.status(500).json({ message: 'Failed to parse file. Check the file format.' })
  }
})

router.get('/', authenticate, async (req, res) => {
  try {
    const routes = await Route.findAll({
      order: [['created_at', 'DESC']],
      include: routeInclude(),
    })
    const jsonRoutes = routes.map(r => formatStops(r.toJSON()))
    jsonRoutes.forEach(r => {
      if (r.stops) r.stops.sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
    })
    res.json(jsonRoutes)
  } catch (error) {
    console.error('List routes error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id, { include: routeInclude() })
    if (!route) return res.status(404).json({ message: 'Route not found.' })
    const plain = formatStops(route.toJSON())
    if (plain.stops) plain.stops.sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
    res.json(plain)
  } catch (error) {
    console.error('Get route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, estimatedDuration, distance, routeType, status, stops } = req.body
    const existing = await Route.findOne({ where: { code } })
    if (existing) return res.status(400).json({ message: 'Route code must be unique.' })
    const t = await sequelize.transaction()
    try {
      const route = await Route.create({ name, code, estimatedDuration, distance, routeType, status: status || 'active' }, { transaction: t })
      if (stops && Array.isArray(stops) && stops.length > 0) {
        await createRouteStops(route.id, stops, t)
      }
      await t.commit()
      const createdRoute = await Route.findByPk(route.id, { include: routeInclude() })
      const plain = formatStops(createdRoute.toJSON())
      if (plain.stops) plain.stops.sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
      res.status(201).json(plain)
    } catch (err) { await t.rollback(); throw err }
  } catch (error) {
    console.error('Create route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { name, code, estimatedDuration, distance, routeType, status, stops } = req.body
    const route = await Route.findByPk(req.params.id)
    if (!route) return res.status(404).json({ message: 'Route not found.' })
    if (code && code !== route.code) {
      const existing = await Route.findOne({ where: { code } })
      if (existing) return res.status(400).json({ message: 'Route code must be unique.' })
    }
    const t = await sequelize.transaction()
    try {
      await route.update({ name, code, estimatedDuration, distance, routeType, status }, { transaction: t })
      if (stops && Array.isArray(stops)) {
        await RouteStop.destroy({ where: { routeId: route.id }, transaction: t })
        await Stop.destroy({ where: { routeId: route.id }, transaction: t })
        if (stops.length > 0) await createRouteStops(route.id, stops, t)
      }
      await t.commit()
      const updatedRoute = await Route.findByPk(route.id, { include: routeInclude() })
      const plain = formatStops(updatedRoute.toJSON())
      if (plain.stops) plain.stops.sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
      res.json(plain)
    } catch (err) { await t.rollback(); throw err }
  } catch (error) {
    console.error('Update route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.patch('/:routeId/stops/:stopId', authenticate, async (req, res) => {
  try {
    const { name, name_ml, nameMl, latitude, longitude, lat, lng } = req.body
    const link = await RouteStop.findOne({ where: { routeId: req.params.routeId, stopId: req.params.stopId } })
    const legacy = await Stop.findOne({ where: { id: req.params.stopId, routeId: req.params.routeId } })
    if (!link && !legacy) return res.status(404).json({ message: 'Stop not found.' })
    const stop = await Stop.findByPk(req.params.stopId)
    if (!stop) return res.status(404).json({ message: 'Stop not found.' })
    const updatedName = name !== undefined ? name : stop.name
    const updatedNameMl = name_ml !== undefined ? name_ml : (nameMl !== undefined ? nameMl : stop.nameMl)
    const updatedLat = lat ?? latitude ?? stop.latitude
    const updatedLng = lng ?? longitude ?? stop.longitude
    if (name !== undefined && name.trim().toLowerCase() !== stop.name.trim().toLowerCase()) {
      const dup = await Stop.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), name.trim().toLowerCase()) })
      if (dup && dup.id !== stop.id) {
        await RouteStop.update({ stopId: dup.id }, { where: { routeId: req.params.routeId, stopId: stop.id } })
        const others = await RouteStop.count({ where: { stopId: stop.id } })
        const assignments = await sequelize.models.BusAssignment.count({ where: { stopId: stop.id } })
        if (others === 0 && assignments === 0) await stop.destroy()
        await dup.update({ name: updatedName, nameMl: updatedNameMl, latitude: updatedLat, longitude: updatedLng })
        return res.json(dup)
      }
    }
    await stop.update({ name: updatedName, nameMl: updatedNameMl, latitude: updatedLat, longitude: updatedLng })
    res.json(stop)
  } catch (error) {
    console.error('Update stop error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.post('/:routeId/stops', authenticate, async (req, res) => {
  try {
    const { name, name_ml, nameMl, latitude, longitude, lat, lng } = req.body
    const route = await Route.findByPk(req.params.routeId, { include: routeInclude() })
    if (!route) return res.status(404).json({ message: 'Route not found.' })
    const plain = formatStops(route.toJSON())
    const nextSeq = (plain.stops?.length || 0) + 1
    const t = await sequelize.transaction()
    try {
      const stop = await findOrCreateStop(name || '', name_ml ?? nameMl ?? null, lat ?? latitude ?? 0, lng ?? longitude ?? 0, t)
      const existingLink = await RouteStop.findOne({ where: { routeId: route.id, stopId: stop.id }, transaction: t })
      if (existingLink) {
        await t.rollback()
        return res.status(400).json({ message: 'Stop already exists in this route.' })
      }
      await RouteStop.create({ routeId: route.id, stopId: stop.id, sequenceOrder: nextSeq }, { transaction: t })
      await t.commit()
      const result = stop.toJSON()
      res.status(201).json({ ...result, lat: result.latitude, lng: result.longitude, sequenceOrder: nextSeq })
    } catch (err) { await t.rollback(); throw err }
  } catch (error) {
    console.error('Add stop error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.delete('/:routeId/stops/:stopId', authenticate, async (req, res) => {
  try {
    const link = await RouteStop.findOne({ where: { routeId: req.params.routeId, stopId: req.params.stopId } })
    const legacy = await Stop.findOne({ where: { id: req.params.stopId, routeId: req.params.routeId } })
    if (link) {
      await link.destroy()
      await RouteStop.update(
        { sequenceOrder: sequelize.literal('sequence_order - 1') },
        { where: { routeId: req.params.routeId, sequenceOrder: { [Op.gt]: link.sequenceOrder } } }
      )
    } else if (legacy) {
      await legacy.destroy()
    } else {
      return res.status(404).json({ message: 'Stop not found.' })
    }
    res.json({ message: 'Stop deleted successfully.' })
  } catch (error) {
    console.error('Delete stop error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.put('/:id/stops/reorder', authenticate, async (req, res) => {
  try {
    const { orderedIds, stops } = req.body
    const route = await Route.findByPk(req.params.id)
    if (!route) return res.status(404).json({ message: 'Route not found.' })
    const t = await sequelize.transaction()
    try {
      if (Array.isArray(orderedIds) && orderedIds.length > 0) {
        for (let i = 0; i < orderedIds.length; i++) {
          const stopId = orderedIds[i]
          await RouteStop.update({ sequenceOrder: i + 1 }, { where: { routeId: route.id, stopId }, transaction: t })
          await Stop.update({ sequenceOrder: i + 1 }, { where: { id: stopId, routeId: route.id }, transaction: t })
        }
      } else if (Array.isArray(stops) && stops.length > 0) {
        await RouteStop.destroy({ where: { routeId: route.id }, transaction: t })
        await Stop.destroy({ where: { routeId: route.id }, transaction: t })
        await createRouteStops(route.id, stops, t)
      }
      await t.commit()
      const updatedRoute = await Route.findByPk(route.id, { include: routeInclude() })
      const plain = formatStops(updatedRoute.toJSON())
      if (plain.stops) plain.stops.sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0))
      res.json(plain)
    } catch (err) { await t.rollback(); throw err }
  } catch (error) {
    console.error('Reorder stops error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id)
    if (!route) return res.status(404).json({ message: 'Route not found.' })
    await RouteStop.destroy({ where: { routeId: route.id } })
    await route.destroy()
    res.json({ message: 'Route deleted successfully.' })
  } catch (error) {
    console.error('Delete route error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router
