import { createHmac } from 'crypto'
import { env } from '../env'

export function hmacCPF(cpf: string): string {
  return createHmac('sha256', env.ENCRYPTO_KEY).update(cpf).digest('hex')
}
