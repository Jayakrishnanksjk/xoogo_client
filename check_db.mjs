import { Sequelize } from 'sequelize'

const sequelize = new Sequelize(
  'postgresql://neondb_owner:npg_BTgJ5i7cEqPu@ep-broad-moon-aotwl3gf-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  }
)

try {
  const [buses] = await sequelize.query('SELECT "busId", "regNumber", id FROM "Buses" LIMIT 10')
  console.log('BUSES:', JSON.stringify(buses, null, 2))

  const [assignments] = await sequelize.query('SELECT bus_id, stop_id, sequence_order FROM "BusAssignments" LIMIT 10')
  console.log('ASSIGNMENTS:', JSON.stringify(assignments, null, 2))
} catch (e) {
  console.error('Error:', e.message)
} finally {
  await sequelize.close()
}
