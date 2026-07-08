import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { authenticate, requireRole } from '../middleware/auth.js'
import BrandSetting from '../models/BrandSetting.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.resolve(__dirname, '../uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `logo${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpg|jpeg|gif|svg|webp)$/i
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true)
    } else {
      cb(new Error('Only image files (png, jpg, jpeg, gif, svg, webp) are allowed'))
    }
  },
})

const router = Router()

async function getOrCreateSettings() {
  let settings = await BrandSetting.findByPk(1)
  if (!settings) {
    settings = await BrandSetting.create({ id: 1 })
  }
  return settings
}

router.get('/branding', async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    res.json(settings)
  } catch (error) {
    console.error('Error fetching branding settings:', error)
    res.status(500).json({ message: 'Failed to fetch branding settings' })
  }
})

router.put('/branding',
  authenticate,
  requireRole('superadmin'),
  upload.single('logo'),
  async (req, res) => {
    try {
      const settings = await getOrCreateSettings()
      const updates = {}

      if (req.file) {
        const logoPath = `/uploads/${req.file.filename}`
        updates.logo_url = logoPath
      }

      const colorFields = [
        'primary_color', 'brand_light', 'brand_dark',
        'sidebar_bg', 'sidebar_active', 'sidebar_hover',
      ]

      for (const field of colorFields) {
        if (req.body[field]) {
          updates[field] = req.body[field]
        }
      }

      await settings.update(updates)
      const updated = await getOrCreateSettings()
      res.json(updated)
    } catch (error) {
      console.error('Error updating branding settings:', error)
      res.status(500).json({ message: 'Failed to update branding settings' })
    }
  }
)

export default router
