'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { LOCAL_USER } from '@/lib/local-user'

interface AuthContextType {
  user: typeof LOCAL_USER
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Local single-user deployment: there is no auth flow. We always present the
 * fixed local user so the UI never shows a sign-in prompt.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<typeof LOCAL_USER>(LOCAL_USER)
  const [loading] = useState(false)

  const signOut = useCallback(async () => {
    // Nothing to sign out of locally; just return to the home page.
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
