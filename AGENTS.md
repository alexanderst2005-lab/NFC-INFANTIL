# ABSOLUTE RULE: STRICT ZERO DATA LOSS & IMPENETRABLE MULTI-DEVICE PERSISTENCE

Whenever making any code edit, feature addition, design tweak, layout update, or bug fix:

1. **NEVER DELETE, RESET, OVERWRITE, OR REVERT EXISTING PROFILES.**
2. All saved profiles (photos, names, birthdates, ages, blood types, schools, grades, medical conditions/care notes, WhatsApp numbers, messages, locations, URLs) MUST BE 100% PRESERVED PERMANENTLY.
3. **AUTHORITATIVE CLOUD PERSISTENCE:**
   - Serverless sync routes (`/api/sync`) MUST ALWAYS read from and write to the central persistent Cloud Master Database (`https://api.restful-api.dev/objects/ff8081819ff5b11001a0178475124974`).
   - Never replace the cloud database with ephemeral fallback endpoints or hardcoded default profiles.
4. **MULTI-DEVICE SYNCHRONIZATION & TIMESTAMP PRIORITIZATION:**
   - Cloud DB updates with newer/equal `updatedAt` timestamps MUST ALWAYS take 100% precedence over local stale cache in `mergeAndPreserveProfiles()`.
   - Edits saved on one device (e.g. Phone) MUST immediately reflect on all other devices (e.g. PC, laptops, tablets) upon page load or background sync.
5. **PHOTO & FIELD PERSISTENCE SAFETY:**
   - Uploaded photos compressed in `pendingUploadedPhoto` MUST NOT be overwritten by empty strings or default avatar SVGs.
   - `sanitizeProfile` MUST NEVER look up `DEFAULT_PROFILES` to overwrite user-edited profile fields.
6. **TOMBSTONE TRACKING:**
   - `deletedIds` tombstones MUST be tracked across `localStorage.nfc_deleted_ids` and Cloud DB so deleted profiles never resurrect and created/edited profiles never disappear.
