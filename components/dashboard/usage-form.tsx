"use client"

import { useState, useEffect } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil } from "lucide-react"
import { addUsageRecord, getUsageRecordByMonth, updateUsageRecord, type UsageRecord } from "@/lib/firestore"
import { getMaxDaysForMonth, validateDaysForMonth } from "@/lib/date-utils"

interface UsageFormProps {
  userId: string
  onSuccess: () => void
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function UsageForm({ userId, onSuccess }: UsageFormProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState("")
  const [days, setDays] = useState("")
  const [cylinders, setCylinders] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const [existingRecord, setExistingRecord] = useState<UsageRecord | null>(null)
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false)
  const [maxDays, setMaxDays] = useState(31)
  const [daysError, setDaysError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()

  // Check for existing record and update max days when month changes
  useEffect(() => {
    async function checkForExisting() {
      if (!month) {
        setExistingRecord(null)
        setMaxDays(31)
        return
      }
      // Update max days for the selected month
      const newMaxDays = getMaxDaysForMonth(month)
      setMaxDays(newMaxDays)
      
      // Reset days error if current value is now valid
      if (days && parseInt(days, 10) <= newMaxDays) {
        setDaysError(null)
      }
      
      const record = await getUsageRecordByMonth(userId, month)
      setExistingRecord(record)
    }
    checkForExisting()
  }, [month, userId, days])

  // Validate days when it changes
  const handleDaysChange = (value: string) => {
    setDays(value)
    if (month && value) {
      const validation = validateDaysForMonth(parseInt(value, 10), month)
      if (!validation.valid) {
        setDaysError(validation.message || null)
      } else {
        setDaysError(null)
      }
    } else {
      setDaysError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!month || !days) return

    // If there's an existing record and user hasn't confirmed edit
    if (existingRecord && !showDuplicateAlert) {
      setShowDuplicateAlert(true)
      return
    }

    setIsLoading(true)
    try {
      if (existingRecord && existingRecord.id) {
        // Update existing record
        await updateUsageRecord(userId, existingRecord.id, {
          days: parseInt(days, 10),
          cylindersUsed: parseInt(cylinders, 10),
        })
      } else {
        // Add new record
        await addUsageRecord(userId, {
          month,
          days: parseInt(days, 10),
          cylindersUsed: parseInt(cylinders, 10),
        })
      }
      onSuccess()
      setOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to save usage record:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setMonth("")
    setDays("")
    setCylinders("1")
    setExistingRecord(null)
    setShowDuplicateAlert(false)
  }

  const handleEditConfirm = () => {
    setShowDuplicateAlert(false)
    // Pre-fill with existing data
    if (existingRecord) {
      setDays(existingRecord.days.toString())
      setCylinders(existingRecord.cylindersUsed.toString())
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Usage
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {existingRecord ? "Edit Usage Data" : "Add Usage Data"}
              </DialogTitle>
              <DialogDescription>
                {existingRecord
                  ? "Update the usage data for this month."
                  : "Record how long your cylinder lasted and how many you used."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="month">Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={`${m} ${currentYear}`}>
                        {m} {currentYear}
                      </SelectItem>
                    ))}
                    {/* Previous year months */}
                    {MONTHS.map((m) => (
                      <SelectItem key={`${m}-prev`} value={`${m} ${currentYear - 1}`}>
                        {m} {currentYear - 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {existingRecord && (
                  <p className="text-xs text-amber-500">
                    Data for this month already exists. Submitting will update it.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="days">Days Cylinder Lasted</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max={maxDays}
                  placeholder={`Max ${maxDays} days`}
                  value={days}
                  onChange={(e) => handleDaysChange(e.target.value)}
                  className={daysError ? "border-red-500" : ""}
                />
                {daysError && (
                  <p className="text-xs text-red-500">{daysError}</p>
                )}
                {month && !daysError && (
                  <p className="text-xs text-muted-foreground">
                    {month} has {maxDays} days
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cylinders">Cylinders Used</Label>
                <Select value={cylinders} onValueChange={setCylinders}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} cylinder{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !month || !days || !!daysError} className="gap-2">
                {existingRecord && <Pencil className="h-4 w-4" />}
                {isLoading ? "Saving..." : existingRecord ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Data Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              You already have usage data for {month}. Do you want to edit the existing record?
              <br />
              <span className="mt-2 block text-sm">
                Current data: {existingRecord?.days} days, {existingRecord?.cylindersUsed} cylinder(s)
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDuplicateAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEditConfirm}>
              Edit for {month}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
