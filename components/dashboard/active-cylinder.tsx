"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Flame, Calendar } from "lucide-react"
import { setActiveCylinder, type ActiveCylinder as ActiveCylinderType } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

interface ActiveCylinderProps {
  userId: string
  cylinder: ActiveCylinderType | null
  averageDays: number
  onUpdate: () => void
}

export function ActiveCylinder({ userId, cylinder, averageDays, onUpdate }: ActiveCylinderProps) {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [expectedDays, setExpectedDays] = useState("30")
  const [isLoading, setIsLoading] = useState(false)

  // Update form values when cylinder changes
  useEffect(() => {
    if (cylinder?.startDate instanceof Timestamp) {
      setStartDate(cylinder.startDate.toDate().toISOString().split("T")[0])
    }
    if (cylinder?.estimatedDays) {
      setExpectedDays(cylinder.estimatedDays.toString())
    } else if (averageDays > 0) {
      setExpectedDays(Math.round(averageDays).toString())
    }
  }, [cylinder, averageDays])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const days = parseInt(expectedDays) || 30
      await setActiveCylinder(userId, {
        startDate: new Date(startDate),
        estimatedDays: days,
      })
      onUpdate()
      setOpen(false)
    } catch (error) {
      console.error("Failed to set active cylinder:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use the stored estimatedDays from cylinder, fallback to averageDays, then 30
  const effectiveEstimatedDays = cylinder?.estimatedDays || averageDays || 30

  const daysSinceStart = cylinder?.startDate
    ? Math.floor(
        (Date.now() -
          (cylinder.startDate instanceof Timestamp
            ? cylinder.startDate.toDate().getTime()
            : 0)) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  const estimatedRemaining = Math.max(0, effectiveEstimatedDays - daysSinceStart)
  const progress = Math.min(100, (daysSinceStart / effectiveEstimatedDays) * 100)

  if (!cylinder) {
    return (
      <Card className="card-lift glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="gradient-text">Active Cylinder</span>
          </CardTitle>
          <CardDescription>Set up your current cylinder to track usage</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Start Tracking</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>New Cylinder</DialogTitle>
                  <DialogDescription>
                    When did you start using your current cylinder?
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expectedDays">Expected Days</Label>
                    <Input
                      id="expectedDays"
                      type="number"
                      min="1"
                      max="90"
                      value={expectedDays}
                      onChange={(e) => setExpectedDays(e.target.value)}
                      placeholder="How many days do you expect this cylinder to last?"
                    />
                    <p className="text-xs text-muted-foreground">
                      Based on your history: ~{averageDays > 0 ? Math.round(averageDays) : 30} days
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Start Tracking"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-lift glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="gradient-text">Active Cylinder</span>
        </CardTitle>
        <CardDescription>
          Started{" "}
          {cylinder.startDate instanceof Timestamp
            ? cylinder.startDate.toDate().toLocaleDateString()
            : "Unknown"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{daysSinceStart} days used</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full progress-gradient transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Est. Remaining</span>
          </div>
          <span className="font-semibold">{estimatedRemaining} days</span>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              New Cylinder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>New Cylinder</DialogTitle>
                <DialogDescription>
                  When did you start using your new cylinder?
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="newStartDate">Start Date</Label>
                  <Input
                    id="newStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newExpectedDays">Expected Days</Label>
                  <Input
                    id="newExpectedDays"
                    type="number"
                    min="1"
                    max="90"
                    value={expectedDays}
                    onChange={(e) => setExpectedDays(e.target.value)}
                    placeholder="How many days do you expect?"
                  />
                  <p className="text-xs text-muted-foreground">
                    Based on your history: ~{averageDays > 0 ? Math.round(averageDays) : 30} days
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Start Tracking"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
