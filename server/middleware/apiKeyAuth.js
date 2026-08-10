import BusApiKey from '../models/BusApiKey.js'

const apiKeyAuth = async (req, res, next) => {
  try {
    // 1. Check Authorization: Bearer <key> header from BusApiKey database table
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const apiKeyRecord = await BusApiKey.findOne({ where: { key: token, status: 'active' } })
      if (apiKeyRecord) {
        apiKeyRecord.lastUsedAt = new Date()
        await apiKeyRecord.save()
        req.apiKey = apiKeyRecord
        return next()
      }
    }

    // 2. Fallback: Check x-api-key header against configured environment key
    const apiKey = req.headers['x-api-key']
    const configuredKey = process.env.BUS_API_KEY || 'default_bus_key'

    if (apiKey && apiKey === configuredKey) {
      return next()
    }

    return res.status(401).json({ message: 'Unauthorized: Invalid API key' })
  } catch (error) {
    console.error('API Key Auth error:', error)
    return res.status(500).json({ message: 'Internal server error during authentication' })
  }
}

export default apiKeyAuth
