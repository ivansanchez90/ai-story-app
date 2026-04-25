import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { toNodeHandler } from 'better-auth/node'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './db'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
    credentials: true,
  }),
)

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    'Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en el archivo .env',
  )
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',

  trustedOrigins: ['http://localhost:5173'],

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

// IMPORTANTE:
// Better Auth debe ir antes de express.json()
// app.all('/api/auth/*', toNodeHandler(auth))
app.all('/api/auth/*splat', toNodeHandler(auth))

// Recién después usamos express.json() para nuestras rutas normales
app.use(express.json())

// Verificamos que la API Key exista
if (!process.env.GEMINI_API_KEY) {
  console.error('FALTA: GEMINI_API_KEY en el archivo .env')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim())

app.post('/api/story/next', async (req, res) => {
  try {
    const { genre, currentTurn, userChoice, history } = req.body

    const systemInstruction = `
      Eres un narrador experto en historias interactivas de ${genre || 'ficción'}.
      El usuario está en el turno ${currentTurn || 1} de un máximo de 30.

      REGLAS ESTRICTAS:
      1. Continúa la historia de forma inmersiva basándote en la última elección del usuario.
      2. Si el turno es menor a 30, proporciona entre 2 y 3 opciones lógicas para que el usuario decida.
      3. Si el turno actual es 30 o si las decisiones llevan a un final natural antes, CONCLUYE la historia definitivamente y NO des más opciones.
      4. La historia debe avanzar de forma coherente, recordando las decisiones anteriores.
      5. El formato de salida debe ser un JSON estructurado de la siguiente manera:
      {
        "narrativa": "Texto detallado de lo que ocurre...",
        "opciones": ["Opción 1", "Opción 2"],
        "esFinal": false
      }
    `

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const incomingHistory = Array.isArray(history) ? history : []

    const chat = model.startChat({
      history: incomingHistory,
    })

    const promptMessage = userChoice
      ? `El usuario eligió: "${userChoice}". Continúa la historia.`
      : 'Comienza la historia introduciendo el escenario, el protagonista y el primer conflicto.'

    const result = await chat.sendMessage(promptMessage)
    const responseText = result.response.text()

    const storyData = JSON.parse(responseText)

    const updatedHistory = [
      ...incomingHistory,
      {
        role: 'user',
        parts: [{ text: promptMessage }],
      },
      {
        role: 'model',
        parts: [{ text: responseText }],
      },
    ]

    res.json({
      narrativa: storyData.narrativa,
      opciones: storyData.esFinal ? [] : (storyData.opciones ?? []),
      esFinal: storyData.esFinal,
      updatedHistory,
    })
  } catch (error) {
    console.error('Error generando la historia:', error)

    res.status(500).json({
      error: 'Hubo un error al generar el siguiente fragmento de la historia.',
    })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-story-backend',
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
