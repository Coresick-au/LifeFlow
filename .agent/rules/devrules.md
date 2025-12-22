---
trigger: always_on
---

Before implementing any new feature, modifying existing functionality, or adding new components to this LifeFlow project, you MUST:

1. Read the development rules workflow by viewing the file [.agent/workflows/dev-rules.md](cci:7://file:///c:/Users/Brad/Documents/~AppProjects/lifeflow/.agent/workflows/dev-rules.md:0:0-0:0)
2. Follow ALL patterns and conventions documented there
3. Check the "Known Issues Log" section to avoid repeating past mistakes

Key areas covered in the rules:
- Data persistence (Supabase + Dexie sync pattern)
- Navigation setup for new views
- Theming/dark mode consistency
- Form input styling
- Click-outside handlers for dropdowns
- Loading states and error handling
- State management patterns

If you discover a new recurring issue or pattern while working, ADD it to the Known Issues Log in the dev-rules.md workflow file.