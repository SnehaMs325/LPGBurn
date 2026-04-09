"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EfficiencyScoreProps {
  score: number
  trend: "improving" | "declining" | "stable"
}

export function EfficiencyScore({ score, trend }: EfficiencyScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400"
    if (score >= 40) return "text-amber-400"
    return "text-primary"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Average"
    if (score >= 20) return "Below Average"
    return "Needs Improvement"
  }

  const getTrendLabel = (trend: "improving" | "declining" | "stable") => {
    switch (trend) {
      case "improving":
        return "Your efficiency is improving"
      case "declining":
        return "Your efficiency is declining"
      default:
        return "Your efficiency is stable"
    }
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <Card className="card-lift glass-card">
      <CardHeader>
        <CardTitle className="gradient-text">Efficiency Score</CardTitle>
        <CardDescription>{getTrendLabel(trend)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative h-32 w-32 efficiency-ring">
          <svg className="h-full w-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted/30"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={getScoreColor(score)}
              style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium">{getScoreLabel(score)}</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Based on trend, consistency, and cylinder duration
        </p>
      </CardContent>
    </Card>
  )
}
