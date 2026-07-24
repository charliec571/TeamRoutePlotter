import { useState } from 'react'

const AUTH_KEY = 'TRP_ADMIN_AUTH'

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(AUTH_KEY) === 'true'
  })

  const login = (pin: string): boolean => {
    const expectedPin = import.meta.env.VITE_ADMIN_PIN || '1916'
    if (pin === expectedPin) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      setIsAdmin(true)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY)
    setIsAdmin(false)
  }

  return { isAdmin, login, logout }
}
