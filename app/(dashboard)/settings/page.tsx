"use client"

import { useUser } from "@civic/auth/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { User, Palette, Shield } from "lucide-react"
import { getUserProfile, updateUserProfile, getUserSettings, updateUserSettings, deleteUserProfile } from "@/lib/firestore"
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

export default function SettingsPage() {
  const { user, signOut } = useUser()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteProfile = async () => {
    if (!user?.id) return
    setIsDeleting(true)
    try {
      await deleteUserProfile(user.id)
      signOut()
    } catch (error) {
      console.error("Failed to delete profile:", error)
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return

      const profile = await getUserProfile(user.id)
      if (profile) {
        setName(profile.name)
        setEmail(profile.email)
      } else {
        setName(user.name || "")
        setEmail(user.email || "")
      }

      const settings = await getUserSettings(user.id)
      if (settings?.theme) {
        setTheme(settings.theme)
      }
    }

    loadSettings()
  }, [user, setTheme])

  const handleSaveProfile = async () => {
    if (!user?.id) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await updateUserProfile(user.id, { name })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    if (user?.id) {
      await updateUserSettings(user.id, { theme: newTheme as "light" | "dark" | "system" })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="glass-card card-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Display Name</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email is managed by Civic Auth and cannot be changed here
                </p>
              </Field>
              <div className="flex items-center gap-4">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-green-500">Saved successfully!</span>
                )}
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="glass-card card-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how LPGBurn looks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>Theme</FieldLabel>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your preferred theme or use system settings
              </p>
            </Field>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="glass-card card-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your account and session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium">Signed in as</p>
              <p className="text-sm text-muted-foreground">{email || "Unknown"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                User ID: {user?.id?.slice(0, 8)}...
              </p>
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Profile
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Your Profile?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your profile, all usage history, settings, and data.
                      This action cannot be undone. You will be signed out automatically.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProfile}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Profile"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
