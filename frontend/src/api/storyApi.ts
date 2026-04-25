import type { Genre, StoryHistoryItem, StoryResponse } from '../types/story'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type GetNextStoryParams = {
  genre: Genre
  currentTurn: number
  userChoice?: string
  history: StoryHistoryItem[]
}

export async function getNextStory({
  genre,
  currentTurn,
  userChoice = '',
  history,
}: GetNextStoryParams): Promise<StoryResponse> {
  const response = await fetch(`${API_URL}/api/story/next`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      genre,
      currentTurn,
      userChoice,
      history,
    }),
  })

  if (!response.ok) {
    let errorMessage = 'No se pudo generar la historia.'

    try {
      const errorData = await response.json()
      errorMessage = errorData.error ?? errorMessage
    } catch {
      // Ignoramos errores de parseo
    }

    throw new Error(errorMessage)
  }

  return response.json()
}
