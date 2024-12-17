import { createDecipheriv, randomBytes } from 'crypto'
import { env } from '../env'

const ENCRYPTION_KEY = env.ENCRYPTO_KEY || randomBytes(32)

export function decryptCPF(encryptedCPF: string): string {
  const [ivHex, encrypted] = encryptedCPF.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv,
  )
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
