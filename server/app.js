import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import groupRoutes from './routes/groups.js'
import routeRoutes from './routes/routes.js'
import busRoutes from './routes/buses.js'
import transitRoutes from './routes/transit.js'

const app = express()

// Global Middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/routes', routeRoutes)
app.use('/api/buses', busRoutes)
app.use('/api', transitRoutes)

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  })
})

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

export default app
