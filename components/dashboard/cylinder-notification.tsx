"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Flame, CheckCircle } from "lucide-react"
import {
  getCylinderNotification,
  setCylinderNotification,
  respondToCylinderPrompt,
  shouldShowCylinderPrompt,
  setActiveCylinder,
  type CylinderNotification as CylinderNotificationType,
} from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

interface CylinderNotificationProps {
  userId: string
  onCylinderChange: () => void
}

export function CylinderNotification({ userId, onCylinderChange }: CylinderNotificationProps) {
  const [notification, setNotification] = useState<CylinderNotificationType | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isResponding, setIsResponding] = useState(false)
  const [responded, setResponded] = useState(false)

  useEffect(() => {
    async function checkNotification() {
      try {
        const data = await getCylinderNotification(userId)
        setNotification(data)
        setShowPrompt(shouldShowCylinderPrompt(data))
      } catch (error) {
        console.error("Failed to check notification:", error)
      } finally {
        setIsLoading(false)
      }
    }
    checkNotification()
  }, [userId])

  const handleResponse = async (response: "new_cylinder" | "same_cylinder") => {
    setIsResponding(true)
    try {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

      // Update notification record
      await setCylinderNotification(userId, {
        lastPromptMonth: currentMonth,
        lastPromptDate: Timestamp.now(),
        status: "pending",
        reminderCount: notification?.reminderCount || 0,
      })

      // Process the response
      await respondToCylinderPrompt(userId, response)

      if (response === "new_cylinder") {
        // Set new cylinder with today's date
        await setActiveCylinder(userId, {
          startDate: now,
          estimatedDays: 30,
        })
        onCylinderChange()
      }

      setResponded(true)
      setTimeout(() => {
        setShowPrompt(false)
        setResponded(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to respond to prompt:", error)
    } finally {
      setIsResponding(false)
    }
  }

  if (isLoading || !showPrompt) {
    return null
  }

  if (responded) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Response recorded. Thank you!</span>
        </CardContent>
      </Card>
    )
  }

  const isReminder = notification?.status === "same_cylinder" && (notification?.reminderCount || 0) > 0

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          {isReminder ? "Cylinder Check Reminder" : "Monthly Cylinder Check"}
        </CardTitle>
        <CardDescription>
          {isReminder
            ? `It's been 5 days since your last check. Have you taken a new LPG cylinder?`
            : `It's a new month! Have you taken a new LPG cylinder?`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={() => handleResponse("new_cylinder")}
          disabled={isResponding}
          className="flex-1 gap-2"
        >
          <Flame className="h-4 w-4" />
          Yes, New Cylinder
        </Button>
        <Button
          onClick={() => handleResponse("same_cylinder")}
          disabled={isResponding}
          variant="outline"
          className="flex-1"
        >
          Still Using Previous
        </Button>
      </CardContent>
      {isReminder && (
        <div className="px-6 pb-4">
          <p className="text-xs text-muted-foreground">
            Reminder #{notification?.reminderCount || 1} - We will check again in 5 days if you select &quot;Still Using Previous&quot;
          </p>
        </div>
      )}
    </Card>
  )
}
