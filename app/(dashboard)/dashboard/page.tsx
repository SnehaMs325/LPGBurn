"use client"

import { useUser } from "@civic/auth/react"
import { useEffect, useState, useCallback } from "react"
import { UsageCharts } from "@/components/dashboard/usage-charts"
import { AnalyticsCards } from "@/components/dashboard/analytics-cards"
import { EfficiencyScore } from "@/components/dashboard/efficiency-score"
import { ActiveCylinder } from "@/components/dashboard/active-cylinder"
import { UsageForm } from "@/components/dashboard/usage-form"
import { CylinderNotification } from "@/components/dashboard/cylinder-notification"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import {
  getUsageHistory,
  getActiveCylinder,
  createUserProfile,
  getUserProfile,
  deleteAllUserData,
  type UsageRecord,
  type ActiveCylinder as ActiveCylinderType,
} from "@/lib/firestore"
import { calculateAnalytics, type AnalyticsData } from "@/lib/analytics"

export default function DashboardPage() {
  const { user } = useUser()
  const [history, setHistory] = useState<UsageRecord[]>([])
  const [cylinder, setCylinder] = useState<ActiveCylinderType | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAllData = async () => {
    if (!user?.id) return
    setIsDeleting(true)
    try {
      await deleteAllUserData(user.id)
      setHistory([])
      setCylinder(null)
      setAnalytics(null)
      loadData()
    } catch (error) {
      console.error("Failed to delete data:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const loadData = useCallback(async () => {
    if (!user?.id) return

    try {
      // Check if user profile exists, create if not
      const profile = await getUserProfile(user.id)
      if (!profile) {
        await createUserProfile(user.id, {
          name: user.name || "User",
          email: user.email || "",
        })
      }

      // Load usage data
      const [historyData, cylinderData] = await Promise.all([
        getUsageHistory(user.id),
        getActiveCylinder(user.id),
      ])

      setHistory(historyData)
      setCylinder(cylinderData)

      // Calculate analytics
      const analyticsData = calculateAnalytics(historyData, cylinderData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight gradient-text">Dashboard</h1>
            <div className="live-indicator">
              <span className="live-dot" />
              <span className="text-xs text-muted-foreground">Live Monitoring</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Track your LPG usage and optimize consumption
          </p>
        </div>
        <div className="flex gap-2">
          {user && <UsageForm userId={user.id} onSuccess={loadData} />}
          {user && history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Usage Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your usage history, cylinder data, and settings.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllData}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete All Data"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {user && <CylinderNotification userId={user.id} onCylinderChange={loadData} />}

      {analytics && <AnalyticsCards analytics={analytics} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageCharts data={analytics?.monthlyData || []} />
        </div>
        <div className="space-y-6">
          {user && (
            <ActiveCylinder
              userId={user.id}
              cylinder={cylinder}
              averageDays={analytics?.averageDaysPerCylinder || 30}
              onUpdate={loadData}
            />
          )}
          {analytics && (
            <EfficiencyScore score={analytics.efficiencyScore} trend={analytics.trend} />
          )}
        </div>
      </div>

      
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-72" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  )
}
