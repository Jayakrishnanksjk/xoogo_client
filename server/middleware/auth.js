import jwt from 'jsonwebtoken'
import { User, Group } from '../models/index.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_xoogo_token_key_123_abc')

    const user = await User.findByPk(decoded.id, {
      include: {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'status']
      }
    })

    if (!user) {
      return res.status(401).json({ message: 'User not found or session invalid.' })
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'User account is deactivated.' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' })
    }
    return res.status(401).json({ message: 'Invalid token.' })
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' })
    }

    next()
  }
}
