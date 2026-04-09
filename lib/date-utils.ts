// Check if a year is a leap year
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

// Get the number of days in a month
export function getDaysInMonth(month: string, year: number): number {
  const monthDays: Record<string, number> = {
    January: 31,
    February: isLeapYear(year) ? 29 : 28,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
  }

  return monthDays[month] || 30
}

// Parse month string like "January 2026" to get month name and year
export function parseMonthString(monthString: string): { month: string; year: number } | null {
  const parts = monthString.split(" ")
  if (parts.length !== 2) return null

  const month = parts[0]
  const year = parseInt(parts[1], 10)

  if (isNaN(year)) return null

  return { month, year }
}

// Get max days allowed for a month string like "January 2026"
export function getMaxDaysForMonth(monthString: string): number {
  const parsed = parseMonthString(monthString)
  if (!parsed) return 31 // Default to 31 if parsing fails

  return getDaysInMonth(parsed.month, parsed.year)
}

// Validate days input against month size
export function validateDaysForMonth(days: number, monthString: string): { valid: boolean; maxDays: number; message?: string } {
  const maxDays = getMaxDaysForMonth(monthString)

  if (days > maxDays) {
    return {
      valid: false,
      maxDays,
      message: `${monthString} only has ${maxDays} days`,
    }
  }

  if (days < 1) {
    return {
      valid: false,
      maxDays,
      message: "Days must be at least 1",
    }
  }

  return { valid: true, maxDays }
}
