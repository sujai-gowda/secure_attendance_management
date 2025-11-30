import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '@/services/api'

interface User {
  username: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
  role: string
  isTeacher: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      verifyToken(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const { apiService } = await import('@/services/api')
      const userInfo = await apiService.verifyToken()
      setToken(tokenToVerify)
      setUser({ username: userInfo.username, role: userInfo.role })
      localStorage.setItem('token', tokenToVerify)
    } catch (error) {
      try {
        const refreshed = await refreshTokenIfNeeded(tokenToVerify)
        if (refreshed) {
          return
        }
      } catch (refreshError) {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshTokenIfNeeded = async (currentToken: string): Promise<boolean> => {
    try {
      const { apiService } = await import('@/services/api')
      const result = await apiService.refreshToken()
      setToken(result.token)
      setUser(result.user)
      localStorage.setItem('token', result.token)
      return true
    } catch (error) {
      return false
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const { apiService } = await import('@/services/api')
      const result = await apiService.login(username, password)
      setToken(result.token)
      setUser(result.user)
      localStorage.setItem('token', result.token)
    } catch (error: any) {
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  const getRole = (): string => {
    return user?.role || 'student'
  }

  const isTeacher = (): boolean => {
    return getRole() === 'teacher'
  }

  const isStudent = (): boolean => {
    return getRole() === 'student'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        loading,
        role: getRole(),
        isTeacher: isTeacher(),
        isStudent: isStudent(),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

