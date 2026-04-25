import { useEffect, useState } from 'react'
import { getNextStory } from '../api/storyApi'
import type { GeminiMessage, Genre, StoryResponse } from '../types/story'

type Props = {
  genre: Genre
  onBack: () => void
}

export default function StoryGame({ genre, onBack }: Props) {
  const [story, setStory] = useState<StoryResponse | null>(null)
  const [history, setHistory] = useState<GeminiMessage[]>([])
  const [turn, setTurn] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startStory = async () => {
    try {
      setLoading(true)
      setError('')
      setStory(null)
      setHistory([])
      setTurn(1)

      const data = await getNextStory({
        genre,
        currentTurn: 1,
        userChoice: '',
        history: [],
      })

      setStory(data)
      setHistory(data.updatedHistory ?? [])
      setTurn(1)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al iniciar la historia.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChoice = async (choice: string) => {
    try {
      const nextTurn = turn + 1

      setLoading(true)
      setError('')

      const data = await getNextStory({
        genre,
        currentTurn: nextTurn,
        userChoice: choice,
        history,
      })

      setStory(data)
      setHistory(data.updatedHistory ?? [])
      setTurn(nextTurn)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al continuar la historia.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    startStory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre])

  return (
    <section className='card story-card'>
      <div className='story-header'>
        <div>
          <p className='eyebrow'>Historia de {genre}</p>
          <h2>Tu aventura interactiva</h2>
        </div>

        <button className='secondary-button' onClick={onBack}>
          Salir
        </button>
      </div>

      {loading && !story && (
        <div className='loading-box'>La IA está escribiendo tu historia...</div>
      )}

      {error && <div className='error-box'>{error}</div>}

      {story && (
        <>
          <div className='narrative-box'>
            <p>{story.narrativa}</p>
          </div>

          {story.esFinal ? (
            <div className='final-box'>
              <h3>Fin de la historia</h3>
              <p>Tu aventura llegó a su final.</p>

              <div className='actions-row'>
                <button className='primary-button' onClick={startStory}>
                  Jugar otra historia
                </button>

                <button className='secondary-button' onClick={onBack}>
                  Elegir otro género
                </button>
              </div>
            </div>
          ) : (
            <div className='options-box'>
              <h3>¿Qué querés hacer?</h3>

              <div className='options-grid'>
                {story.opciones.map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    className='option-button'
                    onClick={() => handleChoice(option)}
                    disabled={loading}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {loading && (
                <p className='muted loading-text'>
                  La historia está continuando...
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
