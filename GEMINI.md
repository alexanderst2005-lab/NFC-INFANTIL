# MANDATORY AGENT RULE: STRICT ZERO DATA LOSS & FIREBASE FIRESTORE SINGLE SOURCE OF TRUTH

Every single AI agent working on this codebase MUST strictly follow this directive without exception:

1. **NEVER RESET, OVERWRITE, OR DELETE EXISTING PROFILES.**
2. When making changes to the admin panel, styling, layout, functions, or UI, preserve 100% of saved profiles, photos, names, dates, blood types, medical conditions, schools, grades, WhatsApp numbers, and locations.
3. **AUTHORITATIVE CENTRAL CLOUD STORAGE (Firebase Firestore v10):**
   - Firestore (`nfc_profiles` collection) is the single source of truth for the entire application.
   - Never use manual localStorage databases to overwrite saved Firestore profile data upon page reload.
4. **MULTI-DEVICE SYNCHRONIZATION:**
   - Real-time `onSnapshot` listeners maintain 100% state synchronization across phone, PC, and all connected clients automatically.
5. **SAFE PHOTO UPLOADS:**
   - Always hold uploaded compressed photos in `pendingUploadedPhoto` memory property before saving to prevent photo loss during form submission.
