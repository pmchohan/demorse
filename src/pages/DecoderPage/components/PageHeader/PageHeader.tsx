import { MorseMark } from '@/components/atoms/MorseMark/MorseMark'
import type { ColorTheme } from '@/hooks/useColorTheme'
import styles from './PageHeader.module.css'

export interface PageHeaderProps {
  readonly theme: ColorTheme
  readonly onToggleTheme: () => void
}

export function PageHeader({ theme, onToggleTheme }: PageHeaderProps) {
  const nextTheme: ColorTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className={styles.root}>
      <div className={styles.brand}>
        <span className={styles.brandMarks} aria-hidden="true">
          <MorseMark symbol="-" size="sm" />
          <MorseMark symbol="." size="sm" />
          <MorseMark symbol="-" size="sm" />
        </span>
        <span className={styles.brandName}>demorse</span>
      </div>

      <button
        type="button"
        className={styles.themeToggle}
        onClick={onToggleTheme}
        aria-label={`Switch to ${nextTheme} theme`}
      >
        <span className={styles.themeOrb} data-theme={theme} aria-hidden="true" />
        <span className={styles.themeLabel}>{nextTheme}</span>
      </button>
    </header>
  )
}
