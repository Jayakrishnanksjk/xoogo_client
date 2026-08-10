import { sequelize, Bus, Route, Stop, BusAssignment, HistoricalEta } from '../models/index.js'

const BUS_REG = process.argv[2] || 'KL-33-0000'
const ROUTE_CODE = process.argv[3] || 'NW0001'

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected.')

    const bus = await Bus.findOne({ where: { regNumber: BUS_REG } })
    if (!bus) throw new Error(`Bus not found: ${BUS_REG}`)

    const route = await Route.findOne({ where: { code: ROUTE_CODE } })
    if (!route) throw new Error(`Route not found: ${ROUTE_CODE}`)

    const stops = await Stop.findAll({
      where: { routeId: route.id },
      order: [['createdAt', 'ASC']]
    })
    if (stops.length === 0) throw new Error(`No stops on route: ${ROUTE_CODE}`)

    bus.routeId = route.id
    await bus.save()

    await BusAssignment.destroy({ where: { busId: bus.id } })
    await BusAssignment.bulkCreate(stops.map((s, i) => ({
      busId: bus.id,
      stopId: s.id,
      sequenceOrder: i + 1
    })))

    const etaPairs = []
    for (let i = 0; i < stops.length - 1; i++) {
      etaPairs.push({
        fromStopId: stops[i].id,
        toStopId: stops[i + 1].id,
        averageDurationSeconds: 300
      })
    }
    await HistoricalEta.destroy({ where: {} })
    await HistoricalEta.bulkCreate(etaPairs)

    console.log(`Linked bus ${BUS_REG} (${bus.id}) to route ${ROUTE_CODE} (${route.id}).`)
    console.log(`Assignments: ${stops.length}, ETA pairs: ${etaPairs.length}`)
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
}

run()
