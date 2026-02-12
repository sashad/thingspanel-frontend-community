import dayjs from 'dayjs'

/**
 * Format timestamp as YYYY-MM-DD HH:mm:ss format string（24hour clock）
 *
 * @param {string | null | undefined} ts - Timestamp
 * @returns {string | null} - Formatted time string
 */
export function formatDateTime(ts: string | null | undefined): string | null {
  return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm:ss') : null
}
