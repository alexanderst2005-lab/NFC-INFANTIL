# MANDATORY AGENT RULE: STRICT ZERO DATA LOSS

Every single AI agent working on this codebase MUST strictly follow this directive:

1. **NEVER RESET, OVERWRITE, OR DELETE EXISTING PROFILES.**
2. When making changes to the admin panel, styling, functions, or API routes, preserve 100% of saved profiles, photos, names, dates, medical conditions, schools, grades, and locations.
3. Use non-destructive merging (`mergeSingleProfile`) and tombstone tracking (`deletedIds`) with Cloud KV persistent storage.
