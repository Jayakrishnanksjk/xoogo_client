import { sequelize, Route, Stop } from '../models/index.js'

async function runBackfill() {
  await sequelize.authenticate()
  console.log('Database connection established.')

  const routes = await Route.findAll({
    include: [{
      model: Stop,
      as: 'stops',
      order: [['created_at', 'ASC']],
    }],
  })

  let updated = 0
  for (const route of routes) {
    const stops = route.stops || []
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i]
      if (stop.sequenceOrder == null) {
        stop.sequenceOrder = i + 1
        await stop.save()
        updated++
      }
    }
  }

  console.log(`Backfill complete. Updated ${updated} stops across ${routes.length} routes.`)
  process.exit(0)
}

runBackfill().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
