import { db } from "./firebase"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore"

export interface UserProfile {
  name: string
  email: string
  createdAt: Timestamp
}

export interface UserSettings {
  theme: "light" | "dark" | "system"
}

export interface ActiveCylinder {
  startDate: Timestamp
  estimatedDays: number
}

export interface UsageRecord {
  id?: string
  month: string
  days: number
  cylindersUsed: number
  createdAt: Timestamp
}

// User Profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", userId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null
}

export async function createUserProfile(
  userId: string,
  data: { name: string; email: string }
): Promise<void> {
  const docRef = doc(db, "users", userId)
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const docRef = doc(db, "users", userId)
  await updateDoc(docRef, data)
}

// User Settings
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const docRef = doc(db, "users", userId, "settings", "preferences")
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? (docSnap.data() as UserSettings) : null
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const docRef = doc(db, "users", userId, "settings", "preferences")
  await setDoc(docRef, settings, { merge: true })
}

// Active Cylinder
export async function getActiveCylinder(userId: string): Promise<ActiveCylinder | null> {
  const docRef = doc(db, "users", userId, "cylinder", "active")
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? (docSnap.data() as ActiveCylinder) : null
}

export async function setActiveCylinder(
  userId: string,
  data: { startDate: Date; estimatedDays: number }
): Promise<void> {
  const docRef = doc(db, "users", userId, "cylinder", "active")
  await setDoc(docRef, {
    startDate: Timestamp.fromDate(data.startDate),
    estimatedDays: data.estimatedDays,
  })
}

// Usage History
export async function getUsageHistory(userId: string): Promise<UsageRecord[]> {
  const colRef = collection(db, "users", userId, "history")
  const q = query(colRef, orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UsageRecord[]
}

export async function addUsageRecord(
  userId: string,
  data: { month: string; days: number; cylindersUsed: number }
): Promise<string> {
  const colRef = collection(db, "users", userId, "history")
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function getUsageRecordByMonth(
  userId: string,
  month: string
): Promise<UsageRecord | null> {
  const history = await getUsageHistory(userId)
  return history.find((r) => r.month === month) || null
}

export async function updateUsageRecord(
  userId: string,
  recordId: string,
  data: { days: number; cylindersUsed: number }
): Promise<void> {
  const docRef = doc(db, "users", userId, "history", recordId)
  await updateDoc(docRef, data)
}

export async function deleteAllUserData(userId: string): Promise<void> {
  // Delete all history records
  const historyCol = collection(db, "users", userId, "history")
  const historySnap = await getDocs(historyCol)
  const historyDeletes = historySnap.docs.map((d) => deleteDoc(d.ref))
  
  // Delete cylinder data
  const cylinderRef = doc(db, "users", userId, "cylinder", "active")
  
  // Delete settings
  const settingsRef = doc(db, "users", userId, "settings", "preferences")
  
  // Delete notifications
  const notificationsRef = doc(db, "users", userId, "notifications", "cylinder")
  
  await Promise.all([
    ...historyDeletes,
    deleteDoc(cylinderRef),
    deleteDoc(settingsRef),
    deleteDoc(notificationsRef),
  ])
}

export async function deleteUserProfile(userId: string): Promise<void> {
  // First delete all user data
  await deleteAllUserData(userId)
  
  // Then delete the user profile
  const userRef = doc(db, "users", userId)
  await deleteDoc(userRef)
}

export async function deleteUsageRecord(userId: string, recordId: string): Promise<void> {
  const docRef = doc(db, "users", userId, "history", recordId)
  await deleteDoc(docRef)
}

// Cylinder Notification System
export interface CylinderNotification {
  lastPromptMonth: string // Format: "YYYY-MM"
  lastPromptDate: Timestamp
  status: "pending" | "new_cylinder" | "same_cylinder"
  reminderCount: number // Track how many reminders sent for "same_cylinder"
  nextReminderDate?: Timestamp
}

export async function getCylinderNotification(userId: string): Promise<CylinderNotification | null> {
  const docRef = doc(db, "users", userId, "notifications", "cylinder")
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? (docSnap.data() as CylinderNotification) : null
}

export async function setCylinderNotification(
  userId: string,
  data: Partial<CylinderNotification>
): Promise<void> {
  const docRef = doc(db, "users", userId, "notifications", "cylinder")
  await setDoc(docRef, data, { merge: true })
}

export async function respondToCylinderPrompt(
  userId: string,
  response: "new_cylinder" | "same_cylinder"
): Promise<void> {
  const now = new Date()
  const docRef = doc(db, "users", userId, "notifications", "cylinder")
  
  if (response === "new_cylinder") {
    // User took a new cylinder - update notification status
    await setDoc(docRef, {
      status: "new_cylinder",
      reminderCount: 0,
      nextReminderDate: null,
    }, { merge: true })
  } else {
    // User still using same cylinder - schedule reminder in 5 days
    const reminderDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    const currentData = await getCylinderNotification(userId)
    
    await setDoc(docRef, {
      status: "same_cylinder",
      reminderCount: (currentData?.reminderCount || 0) + 1,
      nextReminderDate: Timestamp.fromDate(reminderDate),
    }, { merge: true })
  }
}

export function shouldShowCylinderPrompt(notification: CylinderNotification | null): boolean {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  
  // If no notification exists, check if it's the start of the month (first 3 days)
  if (!notification) {
    return now.getDate() <= 3
  }
  
  // If last prompt was for a different month and we're in the first 3 days
  if (notification.lastPromptMonth !== currentMonth && now.getDate() <= 3) {
    return true
  }
  
  // If user selected "same_cylinder" and reminder date has passed
  if (notification.status === "same_cylinder" && notification.nextReminderDate) {
    const reminderDate = notification.nextReminderDate instanceof Timestamp
      ? notification.nextReminderDate.toDate()
      : new Date(notification.nextReminderDate)
    return now >= reminderDate
  }
  
  return false
}
