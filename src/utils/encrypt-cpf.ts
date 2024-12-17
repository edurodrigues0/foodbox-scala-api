import { createCipheriv, randomBytes } from 'crypto'
import { env } from '../env'

const ENCRYPTION_KEY = env.ENCRYPTO_KEY || randomBytes(32)
const IV_LENGTH = 16

export function encryptCPF(cpf: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(cpf, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}
