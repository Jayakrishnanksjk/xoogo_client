import sequelize from '../config/database.js'
import { Bus } from '../models/index.js'

function generateBusId(regNumber, createdAt) {
  let hash = 5381
  const str = `${regNumber}-${new Date(createdAt).getTime()}`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
}

async function migrateBusIds() {
  try {
    console.log('Connecting to database...')
    await sequelize.authenticate()
    console.log('Connected.')

    const buses = await Bus.findAll({ order: [['created_at', 'ASC']] })
    console.log(`Found ${buses.length} buses.\n`)

    let updated = 0
    for (const bus of buses) {
      const regNumber = bus.regNumber || ''
      const newBusId = generateBusId(regNumber, bus.createdAt)

      if (bus.busId !== newBusId) {
        const oldBusId = bus.busId
        bus.busId = newBusId
        await bus.save()
        console.log(`  [${String(updated + 1).padStart(3, ' ')}] ${regNumber.padEnd(18)} ${(oldBusId || 'null').padEnd(8)} → ${newBusId}`)
        updated++
      } else {
        console.log(`  [${String(updated + 1).padStart(3, ' ')}] ${regNumber.padEnd(18)} already ${newBusId} (no change)`)
      }
    }

    console.log(`\nDone. ${updated} bus(es) updated.`)
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateBusIds()
