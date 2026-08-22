"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ThemeMode = "light" | "dark"

const STORAGE_KEY = "kinetic.theme"

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle("dark", mode === "dark")
  root.style.colorScheme = mode
}

function readStoredTheme(): ThemeMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

const ThemeContext = createContext<{
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
} | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light")

  useEffect(() => {
    const next = readStoredTheme()
    setThemeState(next)
    applyTheme(next)
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    applyTheme(mode)
    try {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [setTheme, theme])

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
