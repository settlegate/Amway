import fs from 'fs'
import path from 'path'
import multer from 'multer'

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const ext = path.extname(file.originalname) || '.png'
    cb(null, `promo-${unique}${ext}`)
  },
})

export const uploadPromo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    cb(null, allowed.includes(file.mimetype))
  },
})
