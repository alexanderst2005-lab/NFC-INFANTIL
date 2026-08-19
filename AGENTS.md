# ABSOLUTE RULE: ZERO DATA LOSS & STRICT DATA PRESERVATION

Whenever making any code edit, feature addition, design tweak, or bug fix:

1. **NEVER DELETE, RESET, OVERWRITE, OR RESET EXISTING PROFILES.**
2. All saved profiles (kids, girls, pets, photos, names, dates, schools, grades, medical conditions, WhatsApp numbers, locations, URLs) MUST BE 100% PRESERVED.
3. Code edits MUST ONLY target the specific requested feature or fix.
4. Serverless sync routes (`/api/sync`) MUST ALWAYS read from and write to the central persistent Cloud KV database and respect `deletedIds` tombstones so no deleted profiles resurrect and no created profiles disappear.
