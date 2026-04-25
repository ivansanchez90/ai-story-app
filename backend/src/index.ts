import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth'
import { prisma } from './db'

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://history.blackandred.com.ar',
  'https://api-history.blackandred.com.ar',
  process.env.FRONTEND_URL,
  process.env.BETTER_AUTH_URL,
].filter(Boolean) as string[]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      console.error('Origen bloqueado por CORS:', origin)
      return callback(new Error(`Origen no permitido por CORS: ${origin}`))
    },
    credentials: true,
  }),
)

// IMPORTANTE:
// Better Auth debe ir antes de express.json()
app.all('/api/auth/*splat', toNodeHandler(auth))

// Recién después usamos express.json() para tus rutas normales
app.use(express.json())

// Verificamos que la API Key exista
if (!process.env.GEMINI_API_KEY) {
  console.error('FALTA: GEMINI_API_KEY en el archivo .env')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-story-backend',
  })
})

app.post('/api/story/next', async (req, res) => {
  try {
    const { genre, currentTurn, userChoice, history } = req.body

    console.log('Story request:', {
      genre,
      currentTurn,
      hasUserChoice: Boolean(userChoice),
      historyLength: Array.isArray(history) ? history.length : 0,
    })

    const normalizeHistory = (rawHistory: unknown) => {
      if (!Array.isArray(rawHistory)) return ''

      return rawHistory
        .map((item) => {
          if (!item || typeof item !== 'object') return ''

          const historyItem = item as {
            type?: string
            text?: string
            role?: string
            parts?: { text?: string }[]
          }

          // Nuevo formato simple
          if (historyItem.type === 'narrative' && historyItem.text) {
            return `Narrador: ${historyItem.text}`
          }

          if (historyItem.type === 'choice' && historyItem.text) {
            return `Usuario eligió: ${historyItem.text}`
          }

          // Formato viejo compatible con Gemini: role + parts
          if (
            (historyItem.role === 'user' || historyItem.role === 'model') &&
            Array.isArray(historyItem.parts)
          ) {
            const text = historyItem.parts
              .map((part) => part.text)
              .filter(Boolean)
              .join(' ')

            if (!text) return ''

            return historyItem.role === 'user'
              ? `Usuario: ${text}`
              : `Narrador: ${text}`
          }

          return ''
        })
        .filter(Boolean)
        .slice(-24)
        .join('\n\n')
    }

    const previousHistory = normalizeHistory(history)

    const prompt = `
Eres un narrador experto en historias interactivas de ${genre || 'ficción'}.

La historia debe ser breve, inmersiva y con decisiones claras.
El usuario está en el turno ${currentTurn || 1} de un máximo de 30.

HISTORIAL DE LA HISTORIA:
${previousHistory || 'Todavía no hay historial. Esta es la primera escena.'}

ÚLTIMA DECISIÓN DEL USUARIO:
${userChoice || 'Todavía no eligió ninguna opción. Comienza la historia.'}

REGLAS:
1. Continúa la historia de forma coherente con el historial.
2. No repitas exactamente la escena anterior.
3. Si el turno es menor a 30, devuelve entre 2 y 3 opciones.
4. Si el turno actual es 30 o si la historia llega a un final natural, termina definitivamente.
5. La narrativa no debe ser demasiado larga.
6. Tu respuesta debe ser solamente JSON válido.

Formato obligatorio:
{
  "narrativa": "Texto de la historia...",
  "opciones": ["Opción 1", "Opción 2", "Opción 3"],
  "esFinal": false
}
`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const storyData = JSON.parse(responseText)

    const updatedHistory = [
      ...(Array.isArray(history) ? history : []),
      ...(userChoice
        ? [
            {
              type: 'choice',
              text: userChoice,
            },
          ]
        : []),
      {
        type: 'narrative',
        text: storyData.narrativa,
      },
    ]

    res.json({
      narrativa: storyData.narrativa,
      opciones: storyData.esFinal ? [] : (storyData.opciones ?? []),
      esFinal: Boolean(storyData.esFinal),
      updatedHistory,
    })
  } catch (error) {
    console.error('Error generando la historia:', error)

    res.status(500).json({
      error: 'Hubo un error al generar el siguiente fragmento de la historia.',
      detail: error instanceof Error ? error.message : String(error),
    })
  }
})

app.get('/api/db-check', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.json({
      status: 'ok',
      database: 'connected',
    })
  } catch (error) {
    console.error('Error conectando a la base de datos:', error)

    res.status(500).json({
      status: 'error',
      database: 'not connected',
    })
  }
})

app.get('/api/auth-db-check', async (_req, res) => {
  try {
    const users = await prisma.user.count()
    const accounts = await prisma.account.count()
    const sessions = await prisma.session.count()
    const verifications = await prisma.verification.count()

    res.json({
      status: 'ok',
      tables: {
        user: users,
        account: accounts,
        session: sessions,
        verification: verifications,
      },
    })
  } catch (error) {
    console.error('Error verificando tablas de Better Auth:', error)

    res.status(500).json({
      status: 'error',
      message: 'No se pudieron consultar las tablas de Better Auth',
    })
  }
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
