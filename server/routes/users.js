import express from 'express'
import { Op } from 'sequelize'
import { User, Group } from '../models/index.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

function formatDate(date) {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const time = d.toLocaleTimeString()
  return `${day}/${month}/${year}, ${time}`
}

// Restrict all user CRUD routes to superadmin or admin
router.use(authenticate)
router.use(requireRole('superadmin', 'admin'))

// GET /api/users - List users with optional search filter (tenant-scoped for admin)
router.get('/', async (req, res) => {
  try {
    const { search, role } = req.query
    let whereClause = {}

    if (req.user.role !== 'superadmin') {
      if (!req.user.group_id) {
        return res.json([])
      }
      whereClause.group_id = req.user.group_id
    }

    if (search) {
      whereClause[Op.and] = [
        ...(whereClause[Op.and] || []),
        {
          [Op.or]: [
            { full_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } }
          ]
        }
      ]
    }

    if (role) {
      const roles = role.split(',').map(r => r.trim())
      whereClause.role = roles.length === 1 ? roles[0] : { [Op.in]: roles }
    }

    const users = await User.findAll({
      where: whereClause,
      include: {
        model: Group,
        as: 'group',
        attributes: ['id', 'name']
      },
      order: [['created_at', 'DESC']]
    })

    const formattedUsers = users.map(user => {
      const uJson = user.toJSON()
      return {
        ...uJson,
        group: user.group ? user.group.name : (user.role === 'superadmin' ? 'All Groups' : 'No Group'),
        lastLogin: user.last_login_at ? formatDate(user.last_login_at) : 'Never'
      }
    })

    res.json(formattedUsers)
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/users/:id - Get a user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: {
        model: Group,
        as: 'group',
        attributes: ['id', 'name']
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (req.user.role !== 'superadmin' && user.group_id !== req.user.group_id) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to view this user.' })
    }

    const uJson = user.toJSON()
    res.json({
      ...uJson,
      group: user.group ? user.group.name : (user.role === 'superadmin' ? 'All Groups' : 'No Group'),
      lastLogin: user.last_login_at ? formatDate(user.last_login_at) : 'Never'
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/users - Create a new user (prevents privilege escalation)
router.post('/', async (req, res) => {
  try {
    const { full_name, email, phone, password, role, status, group_id } = req.body

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' })
    }

    // Role elevation prevention
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Only superadmins can create superadmin accounts.' })
    }

    // Tenant isolation for non-superadmin
    const targetGroupId = req.user.role === 'superadmin' ? (group_id || null) : req.user.group_id
    if (req.user.role !== 'superadmin' && group_id && group_id !== req.user.group_id) {
      return res.status(403).json({ message: 'Access denied. You cannot create users for other groups.' })
    }

    // Check if email already exists
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return res.status(409).json({ message: 'Email address already in use.' })
    }

    // Validate group if provided
    if (targetGroupId) {
      const group = await Group.findByPk(targetGroupId)
      if (!group) {
        return res.status(400).json({ message: 'Assigned group not found.' })
      }
    }

    const newUser = await User.create({
      full_name,
      email,
      phone,
      password,
      role: role || 'partner',
      status: status || 'active',
      group_id: targetGroupId
    })

    const userWithGroup = await User.findByPk(newUser.id, {
      include: {
        model: Group,
        as: 'group',
        attributes: ['id', 'name']
      }
    })

    const uJson = userWithGroup.toJSON()
    res.status(201).json({
      ...uJson,
      group: userWithGroup.group ? userWithGroup.group.name : (userWithGroup.role === 'superadmin' ? 'All Groups' : 'No Group'),
      lastLogin: 'Never'
    })
  } catch (error) {
    console.error('Create user error:', error)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') })
    }
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// PATCH /api/users/:id - Update user details (prevents privilege escalation)
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Authorization checks for non-superadmin
    if (req.user.role !== 'superadmin') {
      if (user.group_id !== req.user.group_id || user.role === 'superadmin') {
        return res.status(403).json({ message: 'Access denied. You cannot modify superadmins or users in other groups.' })
      }
      if (req.body.role === 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Only superadmins can assign the superadmin role.' })
      }
      if (req.body.group_id && req.body.group_id !== req.user.group_id) {
        return res.status(403).json({ message: 'Access denied. You cannot transfer users to other groups.' })
      }
    }

    const { full_name, email, phone, password, role, status, group_id } = req.body

    // Prevent deactivating the last active superadmin
    if (status === 'inactive' && user.role === 'superadmin') {
      const activeSuperadminsCount = await User.count({
        where: { role: 'superadmin', status: 'active' }
      })
      if (activeSuperadminsCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate the last active superadmin.' })
      }
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } })
      if (existing) {
        return res.status(409).json({ message: 'Email address already in use.' })
      }
      user.email = email
    }

    if (full_name) user.full_name = full_name
    if (phone !== undefined) user.phone = phone
    if (password) user.password = password
    if (role && (req.user.role === 'superadmin' || role !== 'superadmin')) user.role = role
    if (status) user.status = status
    
    if (group_id !== undefined && req.user.role === 'superadmin') {
      if (group_id) {
        const group = await Group.findByPk(group_id)
        if (!group) {
          return res.status(400).json({ message: 'Group not found.' })
        }
        user.group_id = group_id
      } else {
        user.group_id = null
      }
    }

    await user.save()

    const updatedUser = await User.findByPk(user.id, {
      include: {
        model: Group,
        as: 'group',
        attributes: ['id', 'name']
      }
    })

    const uJson = updatedUser.toJSON()
    res.json({
      ...uJson,
      group: updatedUser.group ? updatedUser.group.name : (updatedUser.role === 'superadmin' ? 'All Groups' : 'No Group'),
      lastLogin: updatedUser.last_login_at ? formatDate(updatedUser.last_login_at) : 'Never'
    })
  } catch (error) {
    console.error('Update user error:', error)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') })
    }
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (req.user.role !== 'superadmin') {
      if (user.group_id !== req.user.group_id || user.role === 'superadmin') {
        return res.status(403).json({ message: 'Access denied. You cannot delete this user.' })
      }
      if (user.id === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own account.' })
      }
    }

    // Prevent deleting the last active superadmin
    if (user.role === 'superadmin') {
      const superadminsCount = await User.count({
        where: { role: 'superadmin' }
      })
      if (superadminsCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last superadmin.' })
      }
    }

    await user.destroy()
    res.json({ success: true, message: 'User deleted successfully.' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

export default router
