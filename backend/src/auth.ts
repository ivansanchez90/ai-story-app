import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'

const backendUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3001'

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

const trustedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',

  'https://history.blackandred.com.ar',
  'https://api-history.blackandred.com.ar',

  'https://*.blackandred.com.ar',

  frontendUrl,
  backendUrl,
]

console.log('BETTER_AUTH_URL:', backendUrl)
console.log('FRONTEND_URL:', frontendUrl)
console.log('TRUSTED_ORIGINS:', trustedOrigins)

export const auth = betterAuth({
  baseURL: backendUrl,

  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
})
