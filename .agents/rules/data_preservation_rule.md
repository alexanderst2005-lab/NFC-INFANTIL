# Strict Data Preservation & Non-Destructive Update Rule

## Core Directive
Whenever making any modification, fix, refactoring, or layout/code update to the administrative panel or application logic:
1. **NEVER modify, delete, reset, replace, or lose any existing profile data.**
2. All registered profiles MUST remain EXACTLY as they are, including:
   - Profile photos (HD uploads or URLs)
   - Names
   - Ages
   - Blood types
   - Additional emergency info
   - WhatsApp numbers and custom messages
   - Location / Maps URLs
   - Individual short URLs / slugs
   - Any other saved fields
3. **NEVER automatically generate dummy test profiles, demo data, or unrequested mock profiles.**
4. Code edits must strictly target the specific feature or bug requested by the user without side effects on existing user data or state.
