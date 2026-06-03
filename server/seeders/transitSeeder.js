import { sequelize, Route, Bus, Stop, BusAssignment, HistoricalEta } from '../models/index.js'

async function runSeeder() {
  try {
    await sequelize.authenticate()
    console.log('Database connection established for seeding.')

    // 1. Get or create Route
    let route = await Route.findOne()
    if (!route) {
      route = await Route.create({
        name: 'Main Transit Route',
        code: 'MTR-01',
        estimatedDuration: '120 mins',
        distance: 12.5,
        routeType: 'inbound',
        polyline: '_p~iF~ps|U_c@_c@g~@_c@g~@_c@_c@',
        status: 'active'
      })
      console.log('Created dynamic Route for transit.')
    } else {
      route.polyline = '_p~iF~ps|U_c@_c@g~@_c@g~@_c@_c@'
      await route.save()
      console.log('Updated existing Route polyline.')
    }

    // 2. Create 24 Stops for the Route
    console.log('Creating 24 Stops...')
    const stopsData = Array.from({ length: 24 }, (_, i) => ({
      name: `Stop ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i/26) : ''}`,
      latitude: 10.0 + i * 0.01,
      longitude: 76.0 + i * 0.01,
      routeId: route.id
    }))
    const stops = await Stop.bulkCreate(stopsData, { returning: true })
    console.log(`Seeded ${stops.length} stops.`)

    // 3. Find or Create Bus 1 (Ordinary) and Bus 2 (Limited)
    // Find buses. If none exist, create dummy ones.
    let buses = await Bus.findAll({ limit: 2 })
    if (buses.length < 2) {
      console.log('Creating template buses...')
      const group = await sequelize.models.Group.findOne()
      const groupId = group ? group.id : '00000000-0000-0000-0000-000000000000'
      
      const bus1 = await Bus.create({
        regNumber: 'KL-01-A-1234',
        simNumber: '9876543210',
        busType: 'ordinary',
        contactName: 'John Doe',
        contactNumber: '9999999999',
        groupId,
        routeId: route.id
      })
      const bus2 = await Bus.create({
        regNumber: 'KL-01-B-5678',
        simNumber: '9876543211',
        busType: 'limited',
        contactName: 'Jane Smith',
        contactNumber: '8888888888',
        groupId,
        routeId: route.id
      })
      buses = [bus1, bus2]
    } else {
      // Ensure they have routeId mapped
      for (const b of buses) {
        b.routeId = route.id
        await b.save()
      }
    }

    const bus1 = buses[0] // Ordinary
    const bus2 = buses[1] // Limited

    // Set busTypes explicitly for test consistency
    bus1.busType = 'ordinary'
    await bus1.save()
    bus2.busType = 'limited'
    await bus2.save()

    console.log(`Using Bus 1 ID: ${bus1.id} (Ordinary)`)
    console.log(`Using Bus 2 ID: ${bus2.id} (Limited)`)

    // 4. Create BusAssignments
    console.log('Creating Bus Assignments...')
    await BusAssignment.destroy({ where: { busId: [bus1.id, bus2.id] } })

    // Bus 1 (Ordinary) gets all 24 stops
    const ordinaryAssignments = stops.map((stop, index) => ({
      busId: bus1.id,
      stopId: stop.id,
      sequenceOrder: index + 1
    }))
    await BusAssignment.bulkCreate(ordinaryAssignments)

    // Bus 2 (Limited) gets a subset of 5 stops
    const limitedStopsIndexes = [0, 5, 11, 17, 23]
    const limitedAssignments = limitedStopsIndexes.map((stopIndex, orderIndex) => ({
      busId: bus2.id,
      stopId: stops[stopIndex].id,
      sequenceOrder: orderIndex + 1
    }))
    await BusAssignment.bulkCreate(limitedAssignments)

    console.log('Bus assignments completed.')

    // 5. Create Historical ETAs (baseline of 300s)
    console.log('Seeding baseline Historical ETAs...')
    await HistoricalEta.destroy({ where: {} })
    const etas = []
    for (let i = 0; i < stops.length - 1; i++) {
      etas.push({
        fromStopId: stops[i].id,
        toStopId: stops[i + 1].id,
        averageDurationSeconds: 300
      })
    }
    await HistoricalEta.bulkCreate(etas)
    console.log('Historical ETAs seeded.')

    console.log('🌱 Transit seeding finished successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Failed to seed database:', error)
    process.exit(1)
  }
}

runSeeder()
