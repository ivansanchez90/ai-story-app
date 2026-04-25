import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const betterAuthSecret = process.env.BETTER_AUTH_SECRET

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    'Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en el archivo .env',
  )
}

if (!betterAuthSecret) {
  throw new Error('Falta BETTER_AUTH_SECRET en el archivo .env')
}

const backendUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3001'
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

const trustedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://history.blackandred.com.ar',
  'https://api-history.blackandred.com.ar',
  frontendUrl,
  backendUrl,
]

console.log('BETTER_AUTH_URL:', backendUrl)
console.log('FRONTEND_URL:', frontendUrl)
console.log('TRUSTED_ORIGINS:', trustedOrigins)

export const auth = betterAuth({
  baseURL: backendUrl,

  secret: betterAuthSecret,

  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
})
