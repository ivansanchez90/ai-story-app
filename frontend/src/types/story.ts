export type Genre = 'Suspenso' | 'Terror' | 'Fantasía'

export type StoryHistoryItem = {
  type: 'narrative' | 'choice'
  text: string
}

export type StoryResponse = {
  narrativa: string
  opciones: string[]
  esFinal: boolean
  updatedHistory: StoryHistoryItem[]
}
