import { Routes, Route, Link } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'

function App() {
  return (
    <>
      <nav>
        <Link to="/">Créer un compte</Link> | <Link to="/login">Connexion</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  )
}

export default App

