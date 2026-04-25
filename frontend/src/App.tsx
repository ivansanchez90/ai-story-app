import { useState } from 'react'
import { authClient } from './lib/auth-client'
import Login from './components/Login'
import GenreSelector from './components/GenreSelector'
import StoryGame from './components/StoryGame'
import type { Genre } from './types/story'
import './App.css'

function App() {
  const { data: session, isPending } = authClient.useSession()
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)

  const handleLogout = async () => {
    await authClient.signOut()
    setSelectedGenre(null)
  }

  if (isPending) {
    return (
      <main className='page-center'>
        <div className='card'>Cargando sesión...</div>
      </main>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <main className='app-shell'>
      <header className='topbar'>
        <div>
          <p className='eyebrow'>Bienvenido</p>
          <h1>{session.user.name}</h1>
        </div>

        <button className='secondary-button' onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      {!selectedGenre ? (
        <GenreSelector onStart={setSelectedGenre} />
      ) : (
        <StoryGame
          genre={selectedGenre}
          onBack={() => setSelectedGenre(null)}
        />
      )}
    </main>
  )
}

export default App
