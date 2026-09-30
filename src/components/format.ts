export function formatTime(timestampSec: number) {
  return new Date(timestampSec * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

/** 8 999 123-45-67 / +7 (999) 123-45-67 → 79991234567 */
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  return digits
}
