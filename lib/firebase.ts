import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDzOzP-AMvRP_b544k9aX2L5CVilVTy-KA",
  authDomain: "ecowatt-4eb35.firebaseapp.com",
  projectId: "ecowatt-4eb35",
  storageBucket: "ecowatt-4eb35.firebasestorage.app",
  messagingSenderId: "454536002640",
  appId: "1:454536002640:web:8f5f215f96b21e68522555"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)
