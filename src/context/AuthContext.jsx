import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useData } from './DataContext.jsx'

const AUTH_KEY = 'kbc_auth_v1'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { state } = useData()
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // Sync stored user with current users list (in case role/data changes).
  useEffect(() => {
    if (!user) return
    const found = state.users.find((u) => u.id === user.id)
    if (!found) {
      setUser(null)
      localStorage.removeItem(AUTH_KEY)
      return
    }
    if (JSON.stringify(found) !== JSON.stringify(user)) {
      setUser(found)
      localStorage.setItem(AUTH_KEY, JSON.stringify(found))
    }
  }, [state.users, user])

  const login = useCallback(
    (username, password) => {
      const found = state.users.find(
        (u) => u.username.toLowerCase() === String(username).toLowerCase() && u.password === password
      )
      if (!found) return { ok: false, error: 'Username atau password salah' }
      setUser(found)
      localStorage.setItem(AUTH_KEY, JSON.stringify(found))
      return { ok: true, user: found }
    },
    [state.users]
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  const value = useMemo(() => ({ user, login, logout, isAuthed: !!user }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
