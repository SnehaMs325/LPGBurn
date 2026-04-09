"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, AlertTriangle } from "lucide-react"
import { LPGLogo } from "@/components/ui/lpg-logo"
import type { AnalyticsData } from "@/lib/analytics"

interface AnalyticsCardsProps {
  analytics: AnalyticsData
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  // Consumption change logic:
  // - Always show absolute value (no negative)
  // - High usage (>55% change or >2 cylinders recently) = red
  // - Normal usage = default color
  const absChange = Math.abs(analytics.consumptionChange)
  const isHighUsage = absChange > 55 || analytics.totalCylindersUsed > 2
  const changeDirection = analytics.consumptionChange > 0 ? "increased" : analytics.consumptionChange < 0 ? "decreased" : "unchanged"

  const trendIcon =
    analytics.trend === "improving" ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : analytics.trend === "declining" ? (
      <TrendingDown className="h-4 w-4 text-red-500" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground" />
    )

  // Determine consumption card styling
  const consumptionTextColor = isHighUsage ? "text-red-500" : "text-foreground"
  const consumptionIcon = isHighUsage ? (
    <AlertTriangle className="h-4 w-4 text-red-500" />
  ) : (
    trendIcon
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="card-lift glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Days/Cylinder</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold stat-highlight">{analytics.averageDaysPerCylinder}</div>
          <p className="text-xs text-muted-foreground">
            Based on {analytics.totalCylindersUsed} cylinders
          </p>
        </CardContent>
      </Card>

      <Card className={`card-lift glass-card ${isHighUsage ? "alert-high" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consumption Change</CardTitle>
          {consumptionIcon}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isHighUsage ? "stat-highlight" : ""}`}>
            {absChange}%
          </div>
          <p className="text-xs text-muted-foreground">
            {changeDirection} vs previous
            {isHighUsage && <span className="block text-red-400 font-medium">High energy usage</span>}
          </p>
        </CardContent>
      </Card>

      <Card className={`card-lift glass-card ${analytics.totalCylindersUsed > 2 ? "alert-high" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cylinders</CardTitle>
          <LPGLogo size="sm" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${analytics.totalCylindersUsed > 2 ? "stat-highlight" : ""}`}>
            {analytics.totalCylindersUsed}
          </div>
          <p className="text-xs text-muted-foreground">
            All time usage
            {analytics.totalCylindersUsed > 2 && <span className="block text-red-400 font-medium">Above normal</span>}
          </p>
        </CardContent>
      </Card>

      <Card className="card-lift glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Est. Remaining</CardTitle>
          <BarChart3 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold stat-highlight">{analytics.estimatedRemainingDays} days</div>
          <p className="text-xs text-muted-foreground">
            Current cylinder
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
