---
description: Development rules and patterns to follow when adding new features to LifeFlow
---

# LifeFlow Development Rules

**IMPORTANT: Read this ENTIRE document before implementing ANY new feature.**

## Key Areas Covered:
- Data persistence (Supabase + Dexie sync pattern)
- Navigation setup for new views
- Theming/dark mode consistency
- Form input styling
- Click-outside handlers for dropdowns
- Loading states and error handling
- State management patterns
- **Feature Completeness:** Every "Create" feature must include its "Edit" and "Delete" counterparts.
- **Proactive Consulting:** You are a product partner, not just a coder. If a request is missing logical UX steps (e.g., confirmation dialogs, empty states), you must flag it.

---

## Critical Interaction Rules (Consultation Protocol)

### The "Pause and Propose" Rule
Before you write code, if you notice a feature is missing a standard UX element (like an edit mode, a back button, or data validation), you **must** state:

> "I've noticed [X] is missing; would you like me to add that now or stick strictly to the request?"

### CRUD Completeness
Never implement a data-entry feature without providing a way to modify or remove that data later, **unless specifically instructed that the data is immutable**.

### The "Better Way" Check
If the user's request contradicts industry-standard UI/UX patterns, or if there is a more efficient way to use our Supabase/Dexie stack, **suggest the alternative before implementation**.

### Edge Case Awareness
Always consider what happens if:
- The sync fails
- The list is empty
- The user enters "junk" data

Ask how these should be handled if the rules in this document don't cover it.

---

## 1. Data Persistence (Supabase + Dexie)

When adding a **new data type** (like stories, thoughts, todos, etc.):

### Required Steps:
1. **Add to Supabase schema** (`supabase/schema.sql`)
   - Create table with proper columns
   - Add Row Level Security (RLS) policies for user isolation
   - Add indexes for frequently queried columns

2. **Add to supabaseService.ts** (`src/services/supabaseService.ts`)
   - Create `get[DataType]()` function
   - Create `add[DataType]()` function
   - Create `update[DataType]()` function
   - Create `delete[DataType]()` function

3. **Add to timelineStore.ts** (`src/store/timelineStore.ts`)
   - Add state variable
   - Add load function - **CRITICAL: Do NOT check `cloudData.length > 0`**
   ```typescript
   // ✅ CORRECT - Always trust cloud data
   if (user && navigator.onLine) {
     const cloudData = await supabaseService.getData(user.id);
     if (cloudData) {  // Only check for null/undefined, NOT length
       await db.table('dataType').clear();
       await db.table('dataType').bulkPut(cloudData);
       set({ dataType: cloudData, isLoading: false });
       return;
     }
   }
   
   // ❌ WRONG - This causes data persistence bugs
   if (cloudData && cloudData.length > 0) { ... }
   ```
   - Add CRUD functions that sync to both Supabase and Dexie

4. **Add to Dexie schema** if needed (`src/lib/db.ts`)

---

## 2. Navigation

When adding a **new view/page**:

### Required Steps:
1. **Add to App.tsx** (`src/App.tsx`)
   - Import the new component
   - Add to `navigationItems` array with icon, label, and type
   - Add case to `renderView()` switch statement

2. **Add to types** (`src/types.ts` or `src/types/index.ts`)
   - Add the view type to `TimelineView` type union

3. **Ensure proper routing** - The view type in navigationItems must match the case in renderView()

---

## 3. Theming / Dark Mode

When creating **new components or UI elements**:

### Required Classes (use these instead of hardcoded colors):
```
// Backgrounds
bg-theme-primary      // Main content background
bg-theme-secondary    // Page/app background  
bg-theme-tertiary     // Hover states, muted backgrounds

// Text
text-theme-primary    // Main text
text-theme-secondary  // Secondary/muted text
text-theme-tertiary   // Very muted text

// Borders
border-theme          // Standard borders

// Buttons
btn-primary           // Primary action buttons (uses accent color)

// Inputs
input-field           // Form inputs (handles focus states)

// Rounded corners
rounded-theme         // Consistent border radius
```

### ❌ AVOID hardcoded colors:
```
// Don't use these directly:
bg-white, bg-gray-100, bg-slate-800, text-gray-900, border-gray-200
text-white (unless on btn-primary or accent background)
```

### ✅ For accent colors, use CSS variables:
```tsx
style={{ color: 'var(--theme-accent)' }}
style={{ backgroundColor: 'var(--theme-accent)' }}
```

---

## 4. Form Inputs

When creating **form fields**:

### Standard input styling:
```tsx
<input
  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 input-field rounded-theme"
/>
```

### For dropdowns/selects:
```tsx
<select className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 input-field rounded-theme">
```

---

## 5. Icons

- Use `lucide-react` for all icons
- Import only needed icons to minimize bundle size
- Standard icon sizes: `w-4 h-4` (small), `w-5 h-5` (medium), `w-6 h-6` (large)

---

## 6. Component Patterns

### Click-outside-to-close for dropdowns:
```tsx
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  };

  if (showDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showDropdown]);
```

---

## 7. Common Mistakes to Avoid

1. **Empty array check bug** - Never check `array.length > 0` when deciding whether to use cloud data
2. **Missing navigation entry** - Always add new views to navigationItems AND renderView()
3. **Hardcoded colors** - Always use theme classes
4. **Missing click-outside handlers** - All dropdowns should close when clicking outside
5. **Forgotten Supabase sync** - New data must be saved to both Supabase AND Dexie

---

## 8. Loading States

Always show loading feedback for async operations:

```tsx
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await saveData();
  } finally {
    setIsLoading(false);
  }
};

// Disable button during loading
<button disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</button>
```

---

## 9. Error Handling & User Feedback

Use `react-hot-toast` for notifications:

```tsx
import toast from 'react-hot-toast';

// Success
toast.success('Story saved successfully!');

// Error
toast.error('Failed to save. Please try again.');

// For try/catch blocks
try {
  await saveData();
  toast.success('Saved!');
} catch (error) {
  console.error('Save failed:', error);
  toast.error('Something went wrong');
}
```

---

## 10. Date Handling

Always use `date-fns` for date operations:

```tsx
import { format, parseISO, differenceInYears } from 'date-fns';

// Formatting
format(new Date(story.date), 'MMM d, yyyy')  // "Dec 23, 2024"
format(new Date(story.date), 'MMMM yyyy')    // "December 2024"

// Parsing ISO strings
const date = parseISO('2024-12-23');

// Age calculation
differenceInYears(new Date(), birthDate);
```

---

## 11. Responsive Design

Use Tailwind breakpoints consistently:
- `md:` - 768px (tablet and up)
- `lg:` - 1024px (desktop and up)

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Different layout on mobile vs desktop
<div className="flex flex-col md:flex-row">
```

---

## 12. Animations

Use existing animation classes from `index.css`:

```tsx
className="animate-fade-in"     // Fade in
className="animate-slide-up"    // Slide up with fade

// With delay
style={{ animationDelay: `${index * 50}ms` }}
```

---

## 13. State Management

**Use Zustand store** (`useTimelineStore`) for:
- Data that persists (stories, profile, settings)
- Data shared across multiple components
- Current view/navigation state

**Use local state** (`useState`) for:
- UI state (dropdowns open/closed, form inputs)
- Temporary data that doesn't need to persist
- Component-specific state

---

## 14. TypeScript Types

When adding new data types:

1. Add interface to `src/types.ts` or `src/types/index.ts`
2. Export from the types file
3. Import where needed: `import { MyType } from '../types';`

```typescript
// In types.ts
export interface MyNewType {
  id: string;
  name: string;
  createdAt: Date;
}
```

---

## 15. File Organization

New components go in `src/components/`
- One component per file
- Name file same as component: `MyComponent.tsx`
- Export as named export: `export const MyComponent`

---

## 16. Known Issues Log

Add recurring issues here as they're discovered:

| Date | Issue | Solution |
|------|-------|----------|
| 2024-12-23 | Data not persisting in incognito | Remove `length > 0` check in load functions |
| 2024-12-23 | Dropdown menus staying open | Add click-outside useEffect handler |
| 2024-12-23 | New views not appearing in nav | Add to both navigationItems AND renderView() |
| 2024-12-23 | Colors wrong in dark mode | Use theme classes, not hardcoded colors |

---

**Last Updated:** 2024-12-23
