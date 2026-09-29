/** Display name for an `event.code`, so bound keys read as people expect. */
const CODE_LABELS: Readonly<Record<string, string>> = {
  Space: 'Space',
  Enter: 'Enter',
  NumpadEnter: 'Num Enter',
  Backspace: 'Backspace',
  Tab: 'Tab',
  Escape: 'Esc',
  ShiftLeft: '⇧ Shift',
  ShiftRight: 'Shift ⇧',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
  AltLeft: 'Alt',
  AltRight: 'Alt',
  MetaLeft: 'Meta',
  MetaRight: 'Meta',
  CapsLock: 'Caps',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
  Minus: '-',
  Equal: '=',
  Backslash: '\\',
  Backquote: '`',
}

export function keyLabel(code: string): string {
  if (CODE_LABELS[code]) {
    return CODE_LABELS[code]
  }

  if (code.startsWith('Key')) {
    return code.slice(3)
  }

  if (code.startsWith('Digit')) {
    return code.slice(5)
  }

  if (code.startsWith('Numpad')) {
    return `Num ${code.slice(6)}`
  }

  return code
}
