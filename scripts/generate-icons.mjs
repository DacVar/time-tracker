import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dirname, '../public/icon.svg'))

const sizes = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
]

for (const { size, file } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(__dirname, '../public', file))
  console.log(`✓ public/${file}`)
}
