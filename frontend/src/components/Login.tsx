import { authClient } from '../lib/auth-client'

export default function Login() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.origin,
    })
  }

  return (
    <main className='page-center'>
      <section className='card login-card'>
        <p className='eyebrow'>IA narrativa interactiva</p>

        <h1>Elige tu propia aventura</h1>

        <p className='muted'>
          Iniciá sesión con Google para crear historias de suspenso, terror o
          fantasía donde tus decisiones cambian el rumbo del relato.
        </p>

        <button className='primary-button' onClick={handleGoogleSignIn}>
          Continuar con Google
        </button>
      </section>
    </main>
  )
}
