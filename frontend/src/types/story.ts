export type Genre = 'Suspenso' | 'Terror' | 'Fantasía'

export type GeminiMessage = {
  role: 'user' | 'model'
  parts: {
    text: string
  }[]
}

export type StoryResponse = {
  narrativa: string
  opciones: string[]
  esFinal: boolean
  updatedHistory: GeminiMessage[]
}
