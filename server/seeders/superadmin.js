import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import sequelize from '../config/database.js'
import { User, Group } from '../models/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Helper to ensure database exists before sync
async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'xoogo_dev'
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: 'postgres'
  }

  const client = new pg.Client(config)
  try {
    await client.connect()
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    )
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it...`)
      await client.query(`CREATE DATABASE "${dbName}"`)
      console.log(`Database "${dbName}" created successfully.`)
    }
  } catch (err) {
    console.error('Database auto-creation check failed:', err.message)
  } finally {
    try {
      await client.end()
    } catch (e) {}
  }
}

const MOCK_GROUPS = [
  { name: 'Madhavi Travels', description: 'Fleet operator in southern region' },
  { name: 'Galaxy Travels', description: 'Inter-state luxury coach operator' },
  { name: 'Starline Travels', description: 'City routes bus operator' },
  { name: 'Ave Maria', description: 'Local school and staff buses' }
]

const MOCK_USERS = [
  {
    full_name: 'Akhil Pavithran',
    email: 'akhil@xoogo.com',
    phone: '+91 99955 51122',
    password: 'Admin@123',
    role: 'superadmin',
    status: 'active'
  },
  {
    full_name: 'Sineesh John',
    email: 'sineesh@madhavitravels.com',
    phone: '+91 98470 12345',
    password: 'Partner@123',
    role: 'partner',
    status: 'active',
    groupName: 'Madhavi Travels'
  },
  {
    full_name: 'Manoj T',
    email: 'manoj@galaxytravels.com',
    phone: '+91 94470 54321',
    password: 'Partner@123',
    role: 'partner',
    status: 'active',
    groupName: 'Galaxy Travels'
  },
  {
    full_name: 'Ramesh T',
    email: 'ramesh@starlinetravels.com',
    phone: '+91 97440 98765',
    password: 'Partner@123',
    role: 'partner',
    status: 'active',
    groupName: 'Starline Travels'
  },
  {
    full_name: 'Santhosh J',
    email: 'santhosh@avemaria.com',
    phone: '+91 90480 56789',
    password: 'Partner@123',
    role: 'partner',
    status: 'inactive',
    groupName: 'Ave Maria'
  }
]

async function seed() {
  try {
    // Ensure the DB exists first
    await ensureDatabaseExists()

    console.log('Connecting to database for seeding...')
    await sequelize.authenticate()
    console.log('Database connected. Syncing models...')
    // Note: index.js will handle sync, but we ensure tables exist
    await sequelize.sync()

    console.log('Seeding groups...')
    const groupInstances = {}
    for (const g of MOCK_GROUPS) {
      const [group] = await Group.findOrCreate({
        where: { name: g.name },
        defaults: g
      })
      groupInstances[g.name] = group
      console.log(`- Group "${g.name}" verified/created.`)
    }

    console.log('Seeding users...')
    // Seed default superadmin admin@xoogo.com if it doesn't exist
    const [defaultSuperadmin] = await User.findOrCreate({
      where: { email: 'admin@xoogo.com' },
      defaults: {
        full_name: 'Super Admin',
        email: 'admin@xoogo.com',
        phone: '+91 90000 00000',
        password: 'Admin@123',
        role: 'superadmin',
        status: 'active'
      }
    })
    console.log(`- Default Super Admin "admin@xoogo.com" verified/created.`)

    // Seed mock users
    for (const u of MOCK_USERS) {
      const existing = await User.findOne({ where: { email: u.email } })
      if (!existing) {
        let group_id = null
        if (u.groupName && groupInstances[u.groupName]) {
          group_id = groupInstances[u.groupName].id
        }
        await User.create({
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          password: u.password,
          role: u.role,
          status: u.status,
          group_id
        })
        console.log(`- User "${u.full_name}" created.`)
      } else {
        console.log(`- User "${u.full_name}" already exists.`)
      }
    }

    console.log('Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seed()
