# MANDATORY AGENT RULE: STRICT ZERO DATA LOSS & MULTI-DEVICE PERSISTENCE ARMOR

Every single AI agent working on this codebase MUST strictly follow this directive without exception:

1. **NEVER RESET, OVERWRITE, OR DELETE EXISTING PROFILES.**
2. When making changes to the admin panel, styling, layout, functions, or API routes, preserve 100% of saved profiles, photos, names, dates, blood types, medical conditions, schools, grades, WhatsApp numbers, and locations.
3. **AUTHORITATIVE CENTRAL CLOUD STORAGE (`/api/sync`):**
   - Must continuously read from and write to the central persistent master store (`https://api.restful-api.dev/objects/ff8081819ff5b11001a0178475124974`).
   - Never use fallback default profiles to overwrite saved profile data upon page reload.
4. **MULTI-DEVICE SYNCHRONIZATION:**
   - In `mergeAndPreserveProfiles()`, newer cloud edits (`updatedAt` timestamp) ALWAYS take 100% precedence over local stale cache so changes saved on phone instantly reflect on PC and other devices.
5. **SAFE PHOTO UPLOADS:**
   - Always hold uploaded compressed photos in `pendingUploadedPhoto` memory property before saving to prevent photo loss during form submission.
