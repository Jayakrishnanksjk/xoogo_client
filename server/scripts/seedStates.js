import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { State, District } from '../models/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function seed() {
  try {
    const dataPath = path.resolve(__dirname, '../../src/india-states-districts.json')
    const rawData = fs.readFileSync(dataPath, 'utf8')
    const data = JSON.parse(rawData)

    console.log('Seeding States and Districts...')

    for (const stateData of data.states) {
      // Create or find State
      const [state] = await State.findOrCreate({
        where: { name: stateData.name },
        defaults: { status: 'active' }
      })

      // Create Districts
      for (const districtData of stateData.districts) {
        await District.findOrCreate({
          where: { name: districtData.name, state_id: state.id },
          defaults: { status: 'active' }
        })
      }
      console.log(`Seeded State: ${state.name} with ${stateData.districts.length} districts.`)
    }

    console.log('Seeding complete.')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding:', error)
    process.exit(1)
  }
}

seed()
