import type { UsageRecord, ActiveCylinder } from "./firestore"
import { Timestamp } from "firebase/firestore"

export interface AnalyticsData {
  averageDaysPerCylinder: number
  totalCylindersUsed: number
  consumptionChange: number
  efficiencyScore: number
  estimatedRemainingDays: number
  trend: "improving" | "declining" | "stable"
  monthlyData: { month: string; days: number; cylinders: number }[]
  peakUsageMonth: { month: string; cylinders: number; days: number } | null
}

export function calculateAnalytics(
  history: UsageRecord[],
  activeCylinder: ActiveCylinder | null
): AnalyticsData {
  if (history.length === 0) {
    return {
      averageDaysPerCylinder: 0,
      totalCylindersUsed: 0,
      consumptionChange: 0,
      efficiencyScore: 0,
      estimatedRemainingDays: 0,
      trend: "stable",
      monthlyData: [],
      peakUsageMonth: null,
    }
  }

  // Sort by date (newest first)
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0
    const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0
    return dateB - dateA
  })

  // Calculate totals
  const totalDays = sortedHistory.reduce((sum, r) => sum + r.days, 0)
  const totalCylinders = sortedHistory.reduce((sum, r) => sum + r.cylindersUsed, 0)
  const averageDays = totalCylinders > 0 ? totalDays / totalCylinders : 0

  // Calculate consumption change (comparing last 2 records)
  let consumptionChange = 0
  if (sortedHistory.length >= 2) {
    const current = sortedHistory[0].days
    const previous = sortedHistory[1].days
    consumptionChange = previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  // Determine trend
  let trend: "improving" | "declining" | "stable" = "stable"
  if (sortedHistory.length >= 3) {
    const recentAvg = (sortedHistory[0].days + sortedHistory[1].days) / 2
    const olderAvg = (sortedHistory[sortedHistory.length - 2].days + sortedHistory[sortedHistory.length - 1].days) / 2
    if (recentAvg > olderAvg * 1.05) trend = "improving"
    else if (recentAvg < olderAvg * 0.95) trend = "declining"
  }

  // Calculate efficiency score (0-100)
  // Based on: trend (40%), consistency (30%), duration vs benchmark (30%)
  const trendScore = trend === "improving" ? 40 : trend === "stable" ? 25 : 10
  
  // Consistency score - lower standard deviation is better
  const daysArray = sortedHistory.map((r) => r.days)
  const mean = daysArray.reduce((a, b) => a + b, 0) / daysArray.length
  const variance = daysArray.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / daysArray.length
  const stdDev = Math.sqrt(variance)
  const consistencyScore = Math.max(0, 30 - (stdDev / mean) * 30)

  // Duration score - assuming 30 days is benchmark
  const benchmark = 30
  const durationScore = Math.min(30, (averageDays / benchmark) * 30)

  const efficiencyScore = Math.round(trendScore + consistencyScore + durationScore)

  // Estimated remaining days
  // Priority: cylinder.estimatedDays (user-entered) > averageDays (historical) > 30 (default)
  let estimatedRemainingDays = 0
  if (activeCylinder) {
    const startDate = activeCylinder.startDate instanceof Timestamp
      ? activeCylinder.startDate.toDate()
      : new Date()
    const daysSinceStart = Math.floor(
      (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const effectiveEstimatedDays = activeCylinder.estimatedDays || averageDays || 30
    estimatedRemainingDays = Math.max(0, Math.round(effectiveEstimatedDays - daysSinceStart))
  }

  // Monthly data for charts
  const monthlyData = sortedHistory
    .slice()
    .reverse()
    .map((r) => ({
      month: r.month,
      days: r.days,
      cylinders: r.cylindersUsed,
    }))

  // Find peak usage month (highest cylinders used or lowest days = highest usage)
  let peakUsageMonth: { month: string; cylinders: number; days: number } | null = null
  if (sortedHistory.length > 0) {
    // Peak usage = month with most cylinders or fewest days (high consumption)
    const peak = sortedHistory.reduce((prev, curr) => {
      // Higher cylinders or lower days = higher usage
      const prevScore = prev.cylindersUsed * 100 - prev.days
      const currScore = curr.cylindersUsed * 100 - curr.days
      return currScore > prevScore ? curr : prev
    })
    peakUsageMonth = {
      month: peak.month,
      cylinders: peak.cylindersUsed,
      days: peak.days,
    }
  }

  return {
    averageDaysPerCylinder: Math.round(averageDays * 10) / 10,
    totalCylindersUsed: totalCylinders,
    consumptionChange: Math.round(consumptionChange * 10) / 10,
    efficiencyScore,
    estimatedRemainingDays,
    trend,
    monthlyData,
    peakUsageMonth,
  }
}

export function calculateWhatIf(
  currentAvgDays: number,
  reductionPercent: number
): { newDays: number; cylindersSavedPerYear: number } {
  // If you reduce usage by X%, your cylinder lasts X% longer
  const newDays = currentAvgDays * (1 + reductionPercent / 100)
  const currentCylindersPerYear = 365 / currentAvgDays
  const newCylindersPerYear = 365 / newDays
  const cylindersSavedPerYear = currentCylindersPerYear - newCylindersPerYear

  return {
    newDays: Math.round(newDays * 10) / 10,
    cylindersSavedPerYear: Math.round(cylindersSavedPerYear * 10) / 10,
  }
}
