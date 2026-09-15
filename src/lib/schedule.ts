import type { Schedule } from '@/types'

const VALID_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])

export function isValidSchedule(schedule: Schedule): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time)) return false
  if (schedule.mode === 'weekly' && (schedule.days.length === 0 || schedule.days.some(day => !VALID_DAYS.has(day)))) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: schedule.tz }).format()
    return true
  } catch {
    return false
  }
}
