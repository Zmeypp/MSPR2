import { useState } from 'react'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    const body = JSON.stringify({ username, password, token })
    const headers = { 'Content-Type': 'application/json' }

    try {
      const res = await fetch('http://localhost:31112/function/authenticate-user', {
        method: 'POST',
        headers,
        body
      })
      const text = await res.text()

      if (res.status === 200) {
        setMessage("✅ Connexion réussie")
      } else {
        setMessage("❌ Échec : " + text)
      }
    } catch (err) {
      setMessage("❌ Erreur : " + err.message)
    }
  }

  return (
    <div>
      <h2>Connexion</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Code 2FA"
          value={token}
          onChange={e => setToken(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>

      <p>{message}</p>
    </div>
  )
}

export default Login

