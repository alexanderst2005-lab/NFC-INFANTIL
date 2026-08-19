# ABSOLUTE RULE: STRICT ZERO DATA LOSS & FIREBASE FIRESTORE SINGLE SOURCE OF TRUTH

Whenever making any code edit, feature addition, design tweak, layout update, or bug fix:

1. **NEVER DELETE, RESET, OVERWRITE, OR REVERT EXISTING PROFILES.**
2. All saved profiles (photos, names, birthdates, ages, blood types, schools, grades, medical conditions/care notes, WhatsApp numbers, messages, locations, URLs) MUST BE 100% PRESERVED PERMANENTLY.
3. **AUTHORITATIVE FIRESTORE CLOUD PERSISTENCE:**
   - Firebase Firestore SDK v10 (`nfc_profiles` collection) is the 100% Single Source of Truth (SSOT).
   - All read operations MUST use Firestore real-time listener `onSnapshot(collection(db, "nfc_profiles"), ...)`.
   - All write operations MUST use `setDoc(doc(db, "nfc_profiles", id), profileData)` with server timestamp tracking.
   - All delete operations MUST use `deleteDoc(doc(db, "nfc_profiles", id))` for true atomic cloud deletion without ghost resurrections.
4. **MULTI-DEVICE SYNCHRONIZATION:**
   - Firestore native real-time subscriptions (`onSnapshot`) propagate edits instantaneously across all devices (phones, tablets, PCs) in milliseconds without page reload.
5. **PHOTO & FIELD PERSISTENCE SAFETY:**
   - Uploaded photos compressed in `pendingUploadedPhoto` MUST NOT be overwritten by empty strings or default avatar SVGs.
   - `sanitizeProfile` MUST NEVER overwrite user-edited profile fields with default values.
