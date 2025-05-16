import { useState } from 'react'

function Register() {
  const [username, setUsername] = useState('')
  const [passwordQR, setPasswordQR] = useState(null)
  const [mfaQR, setMfaQR] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const body = JSON.stringify({ username })
    const headers = { 'Content-Type': 'application/json' }

    try {
      // Générer mot de passe
      const pwRes = await fetch('/function/generate-password', {
        method: 'POST',
        headers,
        body
      })
      const pwText = await pwRes.text()
      console.log('pwText:', pwText)
      let pwData
      try {
        pwData = JSON.parse(pwText)
        setPasswordQR(pwData.qr)
      } catch {
        alert("Réponse mot de passe invalide : " + pwText)
        return
      }

      // Générer MFA
      const mfaRes = await fetch('/function/generate-mfa', {
        method: 'POST',
        headers,
        body
      })      
      const mfaText = await mfaRes.text()
      console.log('mfaText:', mfaText)
      let mfaData
      try {
        mfaData = JSON.parse(mfaText)
        setMfaQR(mfaData.qr)
      } catch {
        alert("Réponse MFA invalide : " + mfaText)
      }

    } catch (err) {
      alert('Erreur lors de la création du compte : ' + err.message)
    }
  }

  return (
    <div>
      <h2>Créer un compte</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom d\'utilisateur"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <button type="submit">Créer</button>
      </form>

      {passwordQR && (
        <>
          <h4>Mot de passe (à scanner ou copier)</h4>
          <img src={`data:image/png;base64,${passwordQR}`} alt="QR Password" />
        </>
      )}

      {mfaQR && (
        <>
          <h4>2FA (TOTP)</h4>
          <img src={`data:image/png;base64,${mfaQR}`} alt="QR MFA" />
        </>
      )}
    </div>
  )
}

export default Register
