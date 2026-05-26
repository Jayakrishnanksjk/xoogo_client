import pg from 'pg'

const passwords = [
  '12345',
  '',
  'postgres',
  'root',
  'admin',
  'password',
  '1234',
  '123456',
  '12345678',
  'admin123',
  'postgres123',
  'xoogo',
  'manager',
  'Pass@123',
  'Password@123',
  '123'
]
const hosts = ['127.0.0.1']

async function probe() {
  for (const host of hosts) {
    for (const pw of passwords) {
      console.log(`Probing host=${host} user=postgres password="${pw}"...`)
      const client = new pg.Client({
        host,
        port: 5432,
        user: 'postgres',
        password: pw,
        database: 'postgres'
      })

      try {
        await client.connect()
        console.log(`✅ SUCCESS! host=${host} password="${pw}" worked!`)
        await client.end()
        process.exit(0)
      } catch (err) {
        console.log(`❌ FAILED: ${err.message}`)
      }
    }
  }
  console.log('Could not find working credentials automatically.')
  process.exit(1)
}

probe()
