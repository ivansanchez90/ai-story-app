import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3001', // La URL donde está corriendo tu backend de Node
})
