import { Op } from 'sequelize'
import { sequelize, Stop, RouteStop, BusAssignment, HistoricalEta } from '../models/index.js'

export async function deduplicateStops() {
  console.log('[migrate] Starting stop deduplication and RouteStop backfill...')
  const stops = await Stop.findAll({ order: [['createdAt', 'ASC']] })
  const groups = new Map()
  for (const s of stops) {
    const norm = (s.name || '').trim().toLowerCase()
    if (!norm) continue
    if (!groups.has(norm)) groups.set(norm, [])
    groups.get(norm).push(s)
  }

  let merged = 0
  for (const [norm, list] of groups) {
    if (list.length <= 1) continue
    const canonical = list[0]
    for (let i = 1; i < list.length; i++) {
      const dup = list[i]
      try {
        const routeStops = await RouteStop.findAll({ where: { stopId: dup.id } })
        for (const rs of routeStops) {
          const exists = await RouteStop.findOne({ where: { routeId: rs.routeId, stopId: canonical.id } })
          if (exists) {
            await rs.destroy()
          } else {
            await rs.update({ stopId: canonical.id })
          }
        }
        if (dup.routeId) {
          const legacyExists = await RouteStop.findOne({ where: { routeId: dup.routeId, stopId: canonical.id } })
          if (!legacyExists) {
            const seq = dup.sequenceOrder ?? 1
            await RouteStop.findOrCreate({
              where: { routeId: dup.routeId, stopId: canonical.id },
              defaults: { sequenceOrder: seq },
            })
          } else if (dup.routeId) {
            const dupRs = await RouteStop.findOne({ where: { routeId: dup.routeId, stopId: dup.id } })
            if (dupRs) await dupRs.destroy()
          }
        }
        await BusAssignment.update({ stopId: canonical.id }, { where: { stopId: dup.id } })
        await HistoricalEta.update({ fromStopId: canonical.id }, { where: { fromStopId: dup.id } })
        await HistoricalEta.update({ toStopId: canonical.id }, { where: { toStopId: dup.id } })
        const stillLinked = await RouteStop.count({ where: { stopId: dup.id } })
        const stillAssigned = await BusAssignment.count({ where: { stopId: dup.id } })
        const stillEta = await HistoricalEta.count({ where: { [Op.or]: [{ fromStopId: dup.id }, { toStopId: dup.id }] } })
        if (stillLinked === 0 && stillAssigned === 0 && stillEta === 0) {
          await dup.destroy()
          merged++
        } else {
          console.log(`[migrate] Keeping duplicate ${dup.id} (${dup.name}) still referenced`)
        }
      } catch (e) {
        console.error(`[migrate] Failed merging ${dup.name} ${dup.id} -> ${canonical.id}:`, e.message, e.stack?.split('\n')[0], e.errors?.map(er=>er.message).join(', '))
      }
    }
  }
  console.log(`[migrate] Merged ${merged} duplicate stops (kept canonical)`)

  const legacy = await Stop.findAll({ where: { routeId: { [Op.ne]: null } } })
  let backfilled = 0
  for (const s of legacy) {
    try {
      const exists = await RouteStop.findOne({ where: { routeId: s.routeId, stopId: s.id } })
      if (!exists) {
        let seq = s.sequenceOrder ?? 1
        const seqExists = await RouteStop.findOne({ where: { routeId: s.routeId, sequenceOrder: seq } })
        if (seqExists) {
          const max = await RouteStop.max('sequenceOrder', { where: { routeId: s.routeId } })
          seq = (max ?? 0) + 1
        }
        await RouteStop.create({ routeId: s.routeId, stopId: s.id, sequenceOrder: seq })
        backfilled++
      }
    } catch (e) {
      console.error(`[migrate] Backfill failed for ${s.name} ${s.id}:`, e.message, e.errors?.map(er=>er.message).join(', '))
    }
  }
  console.log(`[migrate] Backfilled ${backfilled} RouteStop rows from legacy Stop.routeId`)

  if (backfilled > 0) {
    console.log('[migrate] Done. Legacy Stop.routeId retained for rollback; future writes use RouteStop.')
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('deduplicateStops.js')) {
  const run = async () => {
    try {
      await sequelize.authenticate()
      await sequelize.sync({ alter: true })
      await deduplicateStops()
      process.exit(0)
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
  }
  run()
}
