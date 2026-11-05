import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import groupRoutes from './routes/groups.js'
import routeRoutes from './routes/routes.js'
import busRoutes from './routes/buses.js'
import transitRoutes from './routes/transit.js'
import scheduleRoutes from './routes/schedules.js'
import settingsRoutes from './routes/settings.js'
import apiKeyRoutes from './routes/api-keys.js'
import publicRoutes from './routes/public.js'
import stopRoutes from './routes/stops.js'
import masterDataRoutes from './routes/masterData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// Global Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://xoogo-client.onrender.com',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(null, false)
  },
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve built frontend
const distPath = path.resolve(__dirname, '../dist')
console.log('[app] distPath:', distPath)
console.log('[app] CWD:', process.cwd())
app.use(express.static(distPath))

// Serve uploaded files (logos, etc.)
const uploadsPath = path.resolve(__dirname, 'uploads')
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', "default-src 'none'")
  }
}))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/routes', routeRoutes)
app.use('/api/stops', stopRoutes)
app.use('/api/master-data', masterDataRoutes)
app.use('/api/buses', busRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api', transitRoutes)
app.use('/api/api-keys', apiKeyRoutes)
app.use('/api/public', publicRoutes)

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  })
})

// Explicit asset fallback (strictly enclosed to prevent path traversal)
app.get('/assets/*', (req, res, next) => {
  const safeRelative = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.resolve(distPath, '.' + safeRelative);
  const resolvedDist = path.resolve(distPath);

  if (!filePath.startsWith(resolvedDist + path.sep) && filePath !== resolvedDist) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  next();
})

// Serve index.html for all non-API routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// 404 for API routes only
app.use('/api/*', (req, res) => {
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
