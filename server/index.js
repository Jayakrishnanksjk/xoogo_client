import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Load environment variables from server/.env, root .env, or PM2 cwd
dotenv.config({ path: path.resolve(__dirname, '.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

import pg from 'pg'
import app from './app.js'
import sequelize from './config/database.js'

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'))

const port = process.env.PORT || 5000

// Helper function to ensure database exists before starting Sequelize
async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'xoogo_dev'
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error(`Invalid database identifier: "${dbName}". Must contain only alphanumeric characters and underscores.`)
  }
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: 'postgres' // Connect to default pg database first
  }

  const client = new pg.Client(config)
  try {
    await client.connect()
    
    // Check if database exists
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    )

    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it now...`)
      // CREATE DATABASE cannot run inside a transaction block or prepared statement in some contexts, but simple query is fine
      await client.query(`CREATE DATABASE "${dbName}"`)
      console.log(`Database "${dbName}" created successfully.`)
    } else {
      console.log(`Database "${dbName}" exists.`)
    }
  } catch (err) {
    console.error('Error checking/creating database:', err.message)
    console.log('Continuing server start... Sequelize connection might fail if credentials or host/port are wrong.')
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore
    }
  }
}

async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      console.error('FATAL: JWT_SECRET environment variable is missing or too short (minimum 16 characters).')
      console.error('Please configure a secure JWT_SECRET in your .env file or server environment.')
      process.exit(1)
    }

    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && !process.env.DB_HOST) {
      console.error('FATAL: DATABASE_URL environment variable is not set.')
      console.error('Set it in your Render dashboard under Environment Variables.')
      process.exit(1)
    }

    // 1. Ensure the PostgreSQL database exists (skip if using DATABASE_URL / Neon)
    if (!process.env.DATABASE_URL) {
      await ensureDatabaseExists()
    } else {
      console.log('Using DATABASE_URL — skipping local DB creation check.')
    }

    // 2. Test Sequelize connection and Sync models
    console.log('Connecting to database via Sequelize...')
    await sequelize.authenticate()
    console.log('Database connection has been established successfully.')

    // Sync models (creates tables in development if not present)
    console.log('Syncing database models...')
    await sequelize.sync({ alter: true })
    console.log('All models were synchronized successfully.')

    try {
      const { deduplicateStops } = await import('./scripts/deduplicateStops.js')
      await deduplicateStops()
    } catch (e) {
      console.error('[migrate] deduplicateStops failed:', e.message)
    }

    // 3. Start Express server
    app.listen(port, () => {
      console.log(`🚌 Xoogo v${pkg.version} — server is running on port ${port}`)
      console.log(`Health check: http://localhost:${port}/api/health`)
    })
  } catch (error) {
    console.error('Unable to start the server:', error)
    process.exit(1)
  }
}

startServer()
