/* ==========================================================================
   NFC INFANTIL - FIREBASE FIRESTORE CONFIGURATION & INITIALIZATION
   Firebase Modular SDK v10 (CDN Import for Vanilla JS)
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// Web App Firebase Credentials Config
const firebaseConfig = {
    apiKey: "AIzaSyBH9ourohhLedBzMi4I6pO96QhpPVX_PJg",
    authDomain: "nfc-infantil.firebaseapp.com",
    projectId: "nfc-infantil",
    storageBucket: "nfc-infantil.firebasestorage.app",
    messagingSenderId: "793705489788",
    appId: "1:793705489788:web:732ca1bad2c458a210b0f9",
    measurementId: "G-HEJN88X5EX"
};
// Initialize Firebase App, Firestore, and Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    serverTimestamp,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};

// Initial profiles array (Empty by default to prevent auto-injection of demo profiles)
export const INITIAL_PROFILES_SEED = [];
