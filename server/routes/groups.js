import express from 'express'
import { Group, Bus, User, Route } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// GET /api/groups - Get all groups (authenticated users only)
router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [
        {
          model: Bus,
          as: 'buses',
          include: [{ model: Route, as: 'route', attributes: ['id', 'name'] }]
        },
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'email', 'phone', 'role'] },
        { model: User, as: 'users', attributes: ['id', 'full_name', 'email', 'phone', 'role', 'status'] }
      ],
      order: [['name', 'ASC']]
    })
    res.json(groups)
  } catch (error) {
    console.error('List groups error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/groups - Create a new group (authenticated users only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, description, status, ownerId } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Group name is required.' })
    }

    const existingName = await Group.findOne({ where: { name } })
    if (existingName) {
      return res.status(400).json({ message: 'Group name must be unique.' })
    }

    if (code) {
      const existingCode = await Group.findOne({ where: { code } })
      if (existingCode) {
        return res.status(400).json({ message: 'Group code must be unique.' })
      }
    }

    const group = await Group.create({
      name,
      code: code || null,
      description: description || null,
      status: status || 'active',
      ownerId: ownerId || null,
    })

    res.status(201).json(group)
  } catch (error) {
    console.error('Create group error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// PATCH /api/groups/:id - Update a group (authenticated users only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id)
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' })
    }

    const { name, code, description, status, ownerId } = req.body

    if (name && name.trim() !== group.name) {
      const existingName = await Group.findOne({ where: { name: name.trim() } })
      if (existingName) {
        return res.status(400).json({ message: 'Group name must be unique.' })
      }
      group.name = name.trim()
    }

    if (code !== undefined && code !== group.code) {
      if (code) {
        const existingCode = await Group.findOne({ where: { code } })
        if (existingCode) {
          return res.status(400).json({ message: 'Group code must be unique.' })
        }
        group.code = code
      } else {
        group.code = null
      }
    }

    if (description !== undefined) group.description = description
    if (status) group.status = status
    if (ownerId !== undefined) group.ownerId = ownerId || null

    await group.save()

    const updatedGroup = await Group.findByPk(group.id, {
      include: [
        { model: Bus, as: 'buses', include: [{ model: Route, as: 'route', attributes: ['id', 'name'] }] },
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'email', 'phone', 'role'] },
        { model: User, as: 'users', attributes: ['id', 'full_name', 'email', 'phone', 'role', 'status'] }
      ]
    })

    res.json(updatedGroup)
  } catch (error) {
    console.error('Update group error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// DELETE /api/groups/:id - Delete a group (authenticated users only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id)
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' })
    }
    await group.destroy()
    res.json({ success: true, message: 'Group deleted successfully.' })
  } catch (error) {
    console.error('Delete group error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/groups/:id - Get a group by ID (authenticated users only)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [
        { model: Bus, as: 'buses', include: [{ model: Route, as: 'route', attributes: ['id', 'name'] }] },
        { model: User, as: 'owner', attributes: ['id', 'full_name', 'email', 'phone', 'role'] },
        { model: User, as: 'users', attributes: ['id', 'full_name', 'email', 'phone', 'role', 'status'] }
      ]
    })
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' })
    }
    res.json(group)
  } catch (error) {
    console.error('Get group error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router
