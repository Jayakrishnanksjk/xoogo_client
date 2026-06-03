const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  const configuredKey = process.env.BUS_API_KEY || 'default_bus_key'

  if (!apiKey || apiKey !== configuredKey) {
    return res.status(401).json({ message: 'Unauthorized: Invalid API key' })
  }

  next()
}

export default apiKeyAuth
