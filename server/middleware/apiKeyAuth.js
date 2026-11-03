import crypto from 'crypto'
import { Op } from 'sequelize'
import BusApiKey from '../models/BusApiKey.js'

const apiKeyAuth = async (req, res, next) => {
  try {
    // 1. Check Authorization: Bearer <key> header from BusApiKey database table (hashed lookup)
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        const apiKeyRecord = await BusApiKey.findOne({
          where: {
            [Op.or]: [
              { key_hash: tokenHash },
              { key: token }
            ],
            status: 'active'
          }
        })

        if (apiKeyRecord) {
          if (!apiKeyRecord.key_hash) {
            apiKeyRecord.key_hash = tokenHash
          }
          apiKeyRecord.lastUsedAt = new Date()
          await apiKeyRecord.save()
          req.apiKey = apiKeyRecord
          return next()
        }
      }
    }

    // 2. Check x-api-key header against configured environment key (timing-safe comparison, no default fallback)
    const apiKey = req.headers['x-api-key']
    const configuredKey = process.env.BUS_API_KEY

    if (apiKey && configuredKey) {
      const a = Buffer.from(apiKey)
      const b = Buffer.from(configuredKey)
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return next()
      }
    }

    return res.status(401).json({ message: 'Unauthorized: Invalid API key' })
  } catch (error) {
    console.error('API Key Auth error:', error)
    return res.status(500).json({ message: 'Internal server error during authentication' })
  }
}

export default apiKeyAuth
