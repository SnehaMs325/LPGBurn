"use client"

import { CivicAuthProvider } from "@civic/auth/react"
import type { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <CivicAuthProvider
      clientId="6aab6f6a-8376-4a59-9d93-2c8502e6ec18"
      onSignIn={(error) => {
        if (!error) {
          window.location.href = "/dashboard"
        }
      }}
    >
      {children}
    </CivicAuthProvider>
  )
}
