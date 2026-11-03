import fs from 'fs'
import path from 'path'
import multer from 'multer'

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const ext = EXT_BY_MIME[file.mimetype] || '.png'
    cb(null, `promo-${unique}${ext}`)
  },
})

export async function isAllowedImageFile(filePath: string): Promise<boolean> {
  try {
    const fd = await fs.promises.open(filePath, 'r')
    const head = Buffer.alloc(12)
    const { bytesRead } = await fd.read(head, 0, 12, 0)
    await fd.close()
    const png = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47
    const jpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
    const gif = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38
    const webp = bytesRead >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP'
    return png || jpeg || gif || webp
  } catch {
    return false
  }
}

export const uploadPromo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    cb(null, allowed.includes(file.mimetype))
  },
})
