/**
 * Configuration Firebase Client pour Kaweru Web (projet kaweru-app).
 * Lit les variables d'environnement NEXT_PUBLIC_* avec valeurs par défaut de secours.
 */
export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA1Yw_Q0pl3D2knOv7MVf53aARSWPBGQw8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kaweru-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kaweru-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kaweru-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "742458847539",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:742458847539:web:ae9078a5a5b0e1f3b30e46",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-65Z67NXF7J",
};
