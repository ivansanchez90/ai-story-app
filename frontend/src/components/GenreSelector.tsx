import type { Genre } from '../types/story'

type Props = {
  onStart: (genre: Genre) => void
}

const genres: {
  value: Genre
  title: string
  description: string
}[] = [
  {
    value: 'Suspenso',
    title: 'Suspenso',
    description: 'Misterios, tensión, secretos y decisiones peligrosas.',
  },
  {
    value: 'Terror',
    title: 'Terror',
    description:
      'Atmósferas oscuras, amenazas desconocidas y miedo progresivo.',
  },
  {
    value: 'Fantasía',
    title: 'Fantasía',
    description:
      'Mundos mágicos, criaturas, objetos antiguos y aventuras épicas.',
  },
]

export default function GenreSelector({ onStart }: Props) {
  return (
    <section className='card'>
      <p className='eyebrow'>Nueva partida</p>

      <h2>Elegí el tipo de historia</h2>

      <p className='muted'>
        La IA va a crear una historia corta e interactiva. Vas a tomar
        decisiones y el relato avanzará según lo que elijas.
      </p>

      <div className='genre-grid'>
        {genres.map((genre) => (
          <button
            key={genre.value}
            className='genre-card'
            onClick={() => onStart(genre.value)}
          >
            <strong>{genre.title}</strong>
            <span>{genre.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
