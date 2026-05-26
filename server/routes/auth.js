import express from 'express'
import jwt from 'jsonwebtoken'
import { User, Group } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      include: {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'status']
      }
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account is deactivated.' })
    }

    const isMatch = await user.validatePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    // Update last login
    user.last_login_at = new Date()
    await user.save()

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_xoogo_token_key_123_abc',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // Format user response to include group field if any, matching mock expectation
    const userJSON = user.toJSON()
    const groupName = user.group ? user.group.name : (user.role === 'superadmin' ? 'All Groups' : 'No Group')

    res.json({
      token,
      user: {
        ...userJSON,
        group: groupName // add group string for legacy components
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user
    const userJSON = user.toJSON()
    const groupName = user.group ? user.group.name : (user.role === 'superadmin' ? 'All Groups' : 'No Group')

    res.json({
      user: {
        ...userJSON,
        group: groupName
      }
    })
  } catch (error) {
    console.error('Auth me error:', error)
    res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' })
})

export default router
