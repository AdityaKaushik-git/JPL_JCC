import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jpl_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('jpl_token')
    if (!token) { setLoading(false); return }
    api.getMe()
      .then(data => { setUser(data.user); localStorage.setItem('jpl_user', JSON.stringify(data.user)) })
      .catch(() => { logout() })
      .finally(() => setLoading(false))
  }, [])

  function login(token, userData) {
    localStorage.setItem('jpl_token', token)
    localStorage.setItem('jpl_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('jpl_token')
    localStorage.removeItem('jpl_user')
    setUser(null)
  }

  function updateUser(data) {
    const updated = { ...user, ...data }
    localStorage.setItem('jpl_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)