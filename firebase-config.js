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

// Web App Firebase Credentials Config
// Reemplazar con tus credenciales obtenidas de Firebase Console (https://console.firebase.google.com/)
const firebaseConfig = {
    apiKey: "AIzaSy_DEMO_NFC_INFANTIL_KEY_REPLACE_ME",
    authDomain: "nfc-infantil.firebaseapp.com",
    projectId: "nfc-infantil",
    storageBucket: "nfc-infantil.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    serverTimestamp 
};

// Real User Initial Seed (Used only if Firestore collection is completely empty)
export const INITIAL_PROFILES_SEED = [
    {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Arias Rodríguez",
        gender: "boy",
        age: 11,
        bloodType: "B+",
        school: "RIO TAPAJE",
        grade: "4",
        medicalConditions: "ALERGICO",
        parentPhone: "573001234567",
        parentPhone2: "",
        whatsappMessage: "Hola, encontré la información del perfil de Samuel y me gustaría comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
    },
    {
        id: "prof-1787105387792",
        slug: "lucia-torres",
        name: "LUCIA TORRES",
        gender: "girl",
        age: "",
        bloodType: "",
        parentPhone: "",
        parentPhone2: "",
        whatsappMessage: "Hola, encontré la información del perfil de LUCIA TORRES y quiero comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "",
        active: true,
        createdAt: "2026-08-19T02:10:00.000Z",
        updatedAt: "2026-08-19T02:10:00.000Z"
    },
    {
        id: "prof-1787128801484",
        slug: "guillermo-diaz",
        name: "Guillermo Diaz",
        gender: "senior",
        age: "",
        bloodType: "",
        parentPhone: "",
        parentPhone2: "",
        whatsappMessage: "Hola, encontré el perfil de seguridad del adulto mayor Guillermo Diaz y quiero comunicarme con sus familiares.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-19T08:40:00.000Z",
        updatedAt: "2026-08-19T08:40:00.000Z"
    },
    {
        id: "prof-1787129656850",
        slug: "zeus",
        name: "ZEUS",
        gender: "pet",
        age: 6,
        bloodType: "",
        parentPhone: "",
        parentPhone2: "",
        whatsappMessage: "Hola, encontré a la mascota ZEUS y quiero comunicarme con su dueño.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-19T08:54:00.000Z",
        updatedAt: "2026-08-19T08:54:00.000Z"
    },
    {
        id: "prof-006-jose",
        slug: "jose-ramirez",
        name: "José Ramírez",
        gender: "senior",
        birthDate: "1952-08-15",
        age: 74,
        bloodType: "O+",
        parentPhone: "573109876543",
        parentPhone2: "573209998877",
        whatsappMessage: "Hola, encontré el perfil de seguridad del adulto mayor José Ramírez y quiero comunicarme con sus familiares.",
        locationMapsUrl: "https://maps.google.com/?q=4.6097,74.0817",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-18T20:00:00.000Z",
        updatedAt: "2026-08-18T20:00:00.000Z"
    },
    {
        id: "prof-1787028202738",
        slug: "arias-santi",
        name: "Arias santi",
        gender: "boy",
        age: 6,
        bloodType: "O+",
        school: "Hshshs",
        parentPhone: "545454",
        parentPhone2: "",
        whatsappMessage: "Hola, encontré la información del perfil de Arias santi y me gustaría comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        medicalConditions: "",
        photoUrl: "",
        active: true,
        createdAt: "2026-08-18T04:55:03.415Z",
        updatedAt: "2026-08-18T04:55:03.415Z"
    }
];
