import { State, District, Region, Stop, sequelize } from '../models/index.js'

async function sync() {
  try {
    await sequelize.authenticate()
    console.log('Connected.')
    await State.sync({ alter: true })
    await District.sync({ alter: true })
    await Region.sync({ alter: true })
    await Stop.sync({ alter: true })
    await sequelize.sync({ alter: true })
    console.log('Synced successfully.')
    process.exit(0)
  } catch (error) {
    console.error('Error syncing:', error)
    process.exit(1)
  }
}

sync()
