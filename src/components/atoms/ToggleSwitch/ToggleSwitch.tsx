import styles from './ToggleSwitch.module.css'

export interface ToggleSwitchProps {
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly label: string
  readonly hint?: string
}

/**
 * An accessible switch built from a checkbox input, so it keeps the keyboard and
 * screen-reader behaviour of a form control while reading as a toggle.
 */
export function ToggleSwitch({ checked, onChange, label, hint }: ToggleSwitchProps) {
  return (
    <label className={styles.root}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track} data-on={checked} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint ? <span className={styles.hint}>{hint}</span> : null}
      </span>
    </label>
  )
}
