"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Flame, Plus, X, ArrowRight, SkipForward } from "lucide-react"
import { addUsageRecord, setActiveCylinder } from "@/lib/firestore"
import { getMaxDaysForMonth } from "@/lib/date-utils"

interface PreviousDataFormProps {
  userId: string
  onComplete: () => void
  onSkip: () => void
}

interface HistoryEntry {
  id: string
  month: string
  days: string
  cylinders: string
  maxDays: number
  daysError?: string
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function PreviousDataForm({ userId, onComplete, onSkip }: PreviousDataFormProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([
    { id: "1", month: "", days: "", cylinders: "1", maxDays: 31 },
  ])
  const [currentCylinderDate, setCurrentCylinderDate] = useState("")
  const [expectedDays, setExpectedDays] = useState("30")
  const [isLoading, setIsLoading] = useState(false)

  const currentYear = new Date().getFullYear()

  const addEntry = () => {
    setEntries([
      ...entries,
      { id: Date.now().toString(), month: "", days: "", cylinders: "1", maxDays: 31 },
    ])
  }

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id))
    }
  }

  const updateEntry = (id: string, field: keyof HistoryEntry, value: string) => {
    setEntries(
      entries.map((e) => {
        if (e.id !== id) return e
        
        const updated = { ...e, [field]: value }
        
        // If month changed, update maxDays
        if (field === "month" && value) {
          updated.maxDays = getMaxDaysForMonth(value)
          // Clear days error if now valid
          if (updated.days && parseInt(updated.days, 10) <= updated.maxDays) {
            updated.daysError = undefined
          }
        }
        
        // If days changed, validate
        if (field === "days" && updated.month && value) {
          const daysNum = parseInt(value, 10)
          if (daysNum > updated.maxDays) {
            updated.daysError = `${updated.month} only has ${updated.maxDays} days`
          } else if (daysNum < 1) {
            updated.daysError = "Days must be at least 1"
          } else {
            updated.daysError = undefined
          }
        }
        
        return updated
      })
    )
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Add historical entries
      for (const entry of entries) {
        if (entry.month && entry.days) {
          await addUsageRecord(userId, {
            month: entry.month,
            days: parseInt(entry.days, 10),
            cylindersUsed: parseInt(entry.cylinders, 10),
          })
        }
      }

      // Set current cylinder if provided
      if (currentCylinderDate) {
        await setActiveCylinder(userId, {
          startDate: new Date(currentCylinderDate),
          estimatedDays: parseInt(expectedDays, 10) || 30,
        })
      }

      onComplete()
    } catch (error) {
      console.error("Failed to save previous data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasValidData = (entries.some((e) => e.month && e.days && !e.daysError) || currentCylinderDate)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Flame className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Welcome to LPGBurn!</h1>
        <p className="mt-2 text-muted-foreground">
          Would you like to add your previous LPG usage history? This helps us provide better insights.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previous Cylinder History (Optional)</CardTitle>
          <CardDescription>
            Add data from your past cylinders to get more accurate predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map((entry, index) => (
            <div key={entry.id} className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label>Month {index + 1}</Label>
                <Select
                  value={entry.month}
                  onValueChange={(v) => updateEntry(entry.id, "month", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={`${m}-${currentYear}`} value={`${m} ${currentYear}`}>
                        {m} {currentYear}
                      </SelectItem>
                    ))}
                    {MONTHS.map((m) => (
                      <SelectItem key={`${m}-${currentYear - 1}`} value={`${m} ${currentYear - 1}`}>
                        {m} {currentYear - 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28 space-y-2">
                <Label>Days</Label>
                <Input
                  type="number"
                  min="1"
                  max={entry.maxDays}
                  placeholder={`Max ${entry.maxDays}`}
                  value={entry.days}
                  onChange={(e) => updateEntry(entry.id, "days", e.target.value)}
                  className={entry.daysError ? "border-red-500" : ""}
                />
                {entry.daysError && (
                  <p className="text-xs text-red-500">{entry.daysError}</p>
                )}
              </div>
              <div className="w-28 space-y-2">
                <Label>Cylinders</Label>
                <Select
                  value={entry.cylinders}
                  onValueChange={(v) => updateEntry(entry.id, "cylinders", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {entries.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(entry.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEntry}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Month
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Cylinder (Optional)</CardTitle>
          <CardDescription>
            When did you start using your current cylinder?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={currentCylinderDate}
                onChange={(e) => setCurrentCylinderDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Days</Label>
              <Input
                type="number"
                min="1"
                max="90"
                placeholder="30"
                value={expectedDays}
                onChange={(e) => setExpectedDays(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={onSkip} className="gap-2">
            <SkipForward className="h-4 w-4" />
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !hasValidData}
            className="gap-2"
          >
            {isLoading ? "Saving..." : "Continue to Dashboard"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
