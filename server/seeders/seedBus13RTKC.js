import { sequelize, Bus, Route, Stop, Schedule, ScheduleRoute, BusSchedule, BusAssignment, HistoricalEta } from '../models/index.js'

const BUS_ID = process.argv[2] || '13RTKC'

const SCHEDULES = [
  { name: 'Morning Trip 1', startTime: '06:00:00', endTime: '09:00:00', routeCode: '13R-01', routeName: 'Fort Kochi - Aluva' },
  { name: 'Morning Trip 2', startTime: '07:30:00', endTime: '10:30:00', routeCode: '13R-02', routeName: 'Aluva - Vytilla' },
  { name: 'Midday Trip 1', startTime: '11:00:00', endTime: '14:00:00', routeCode: '13R-03', routeName: 'Vytilla - Kakkanad' },
  { name: 'Midday Trip 2', startTime: '13:30:00', endTime: '16:30:00', routeCode: '13R-04', routeName: 'Kakkanad - Edappally' },
  { name: 'Evening Trip 1', startTime: '17:00:00', endTime: '20:00:00', routeCode: '13R-05', routeName: 'Edappally - Kaloor' },
  { name: 'Evening Trip 2', startTime: '19:00:00', endTime: '22:00:00', routeCode: '13R-06', routeName: 'Kaloor - Fort Kochi' },
]

const STOP_NAMES = {
  '13R-01': ['Fort Kochi', 'Mattancherry', 'Thevara', 'Ernakulam South', 'M.G. Road', 'Kaloor', 'Palarivattom', 'Kalamassery', 'Aluva'],
  '13R-02': ['Aluva', 'Kalamassery', 'Edappally', 'Palarivattom', 'Vytilla Hub'],
  '13R-03': ['Vytilla Hub', 'Palarivattom', 'Kakkanad Jn', 'SEZ Infopark', 'Kakkanad'],
  '13R-04': ['Kakkanad', 'SEZ Infopark', 'Kakkanad Jn', 'Palarivattom', 'Edappally'],
  '13R-05': ['Edappally', 'Palarivattom', 'Kaloor', 'Cochin Jn', 'Kacheripady'],
  '13R-06': ['Kaloor', 'M.G. Road', 'Ernakulam South', 'Thevara', 'Mattancherry', 'Fort Kochi'],
}

function generateStops(route, nameList) {
  return nameList.map((name, i) => ({
    name,
    latitude: 10.0 + i * 0.01,
    longitude: 76.28 + i * 0.01,
    sequenceOrder: i + 1,
    routeId: route.id,
  }))
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected.')

    const bus = await Bus.findOne({ where: { busId: BUS_ID } })
    if (!bus) throw new Error(`Bus not found with busId: ${BUS_ID}`)
    console.log(`Bus found: ${bus.regNumber} (id: ${bus.id})`)

    let created = 0
    for (const sched of SCHEDULES) {
      const existingSchedule = await Schedule.findOne({ where: { name: sched.name } })
      if (existingSchedule) {
        console.log(`Skip schedule "${sched.name}" (already exists).`)
        continue
      }

      const route = await Route.create({
        name: sched.routeName,
        code: sched.routeCode,
        estimatedDuration: '90 mins',
        distance: 18.5,
        routeType: 'inbound',
        status: 'active',
      })
      const stops = await Stop.bulkCreate(generateStops(route, STOP_NAMES[sched.routeCode] || ['Stop A', 'Stop B', 'Stop C']), { returning: true })

      const schedule = await Schedule.create({
        name: sched.name,
        description: `Dummy test schedule for bus ${BUS_ID}`,
        status: 'active',
        startTime: sched.startTime,
        endTime: sched.endTime,
      })

      await ScheduleRoute.create({ scheduleId: schedule.id, routeId: route.id, sequenceOrder: 1 })
      await BusSchedule.create({ busId: bus.id, scheduleId: schedule.id })
      await BusAssignment.bulkCreate(stops.map((s, i) => ({ busId: bus.id, stopId: s.id, sequenceOrder: i + 1 })))

      const etaPairs = []
      for (let i = 0; i < stops.length - 1; i++) {
        etaPairs.push({
          fromStopId: stops[i].id,
          toStopId: stops[i + 1].id,
          averageDurationSeconds: 300,
        })
      }
      if (etaPairs.length > 0) await HistoricalEta.bulkCreate(etaPairs)

      created++
      console.log(`Created "${sched.name}" -> route ${route.code} (${stops.length} stops, ${etaPairs.length} ETA pairs)`)
    }

    if (created === 0) {
      console.log('Nothing new created. Run: node seeders/seedBus13RTKC.js')
    } else {
      console.log(`Done. Created ${created} schedule(s) for bus ${BUS_ID}.`)
    }
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
}

run()
