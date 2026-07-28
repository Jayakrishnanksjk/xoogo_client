import { Router } from 'express'
import crypto from 'crypto'
import { BusApiKey, Bus } from '../models/index.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireRole('superadmin'))

router.get('/', async (req, res) => {
  try {
    const keys = await BusApiKey.findAll({
      include: [{ model: Bus, as: 'bus', attributes: ['id', 'regNumber', 'busId'] }],
      order: [['created_at', 'DESC']]
    })
    res.json(keys)
  } catch (error) {
    console.error('List API keys error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.post('/generate', async (req, res) => {
  try {
    const { busId } = req.body
    if (!busId) {
      return res.status(400).json({ message: 'busId is required.' })
    }
    const bus = await Bus.findByPk(busId)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found.' })
    }
    const rawKey = 'bus_' + crypto.randomBytes(24).toString('hex')
    const apiKey = await BusApiKey.create({ busId: bus.id, key: rawKey })
    const full = await BusApiKey.findByPk(apiKey.id, {
      include: [{ model: Bus, as: 'bus', attributes: ['id', 'regNumber', 'busId'] }]
    })
    res.status(201).json(full)
  } catch (error) {
    console.error('Generate API key error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const apiKey = await BusApiKey.findByPk(req.params.id)
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found.' })
    }
    apiKey.status = 'revoked'
    await apiKey.save()
    res.json({ message: 'API key revoked successfully.' })
  } catch (error) {
    console.error('Revoke API key error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

router.delete('/:id/permanent', async (req, res) => {
  try {
    const apiKey = await BusApiKey.findByPk(req.params.id)
    if (!apiKey) {
      return res.status(404).json({ message: 'API key not found.' })
    }
    await apiKey.destroy()
    res.json({ message: 'API key permanently deleted.' })
  } catch (error) {
    console.error('Delete API key error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router