import { beforeAll, afterAll } from 'vitest'
import sequelize from '../config/database.js'
import '../models/index.js'

beforeAll(async () => {
  try {
    await sequelize.authenticate()
    console.log('Test DB connected')
    await sequelize.sync()
    console.log('Test DB synced')
  } catch (err) {
    console.error('Test DB setup failed:', err.message)
    throw err
  }
})

afterAll(async () => {
  await sequelize.close()
  console.log('Test DB connection closed')
})
