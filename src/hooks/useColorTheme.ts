import { useCallback, useEffect, useState } from 'react'

export type ColorTheme = 'dark' | 'light'

const STORAGE_KEY = 'morse-decoder-theme'
const DEFAULT_THEME: ColorTheme = 'dark'

function readStoredTheme(): ColorTheme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)

    return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME
  } catch {
    // Storage can be unavailable (private mode) — fall back to the default.
    return DEFAULT_THEME
  }
}

/** Light/dark toggle driven by `data-theme` on `<html>` — no re-render of the tree. */
export function useColorTheme(): { theme: ColorTheme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<ColorTheme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme

    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Theme simply stays session-only when storage is blocked.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
