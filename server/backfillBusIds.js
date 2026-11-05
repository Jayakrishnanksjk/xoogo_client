import { Sequelize } from 'sequelize'
import { Bus } from './models/index.js'
import sequelize from './config/database.js'

function generateBusId(regNumber) {
  let hash = 5381
  const str = String(regNumber).trim()
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
}

async function backfill() {
  try {
    await sequelize.authenticate()
    console.log('Connected to database.')
    
    const buses = await Bus.findAll()
    let updatedCount = 0
    
    for (const bus of buses) {
      if (!bus.busId) {
        const newBusId = generateBusId(bus.regNumber)
        await bus.update({ busId: newBusId })
        updatedCount++
        console.log(`Updated bus ${bus.regNumber} with busId ${newBusId}`)
      }
    }
    
    console.log(`Backfill complete. Updated ${updatedCount} buses.`)
    process.exit(0)
  } catch (error) {
    console.error('Failed to backfill:', error)
    process.exit(1)
  }
}

backfill()
