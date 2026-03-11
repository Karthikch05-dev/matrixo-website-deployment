# Copilot Instructions for matriXO Website

## Architecture Overview

**Next.js 14 App Router** ed-tech platform with event ticketing. Key domains:
- `matrixo.in` → Production (main branch)
- `beta.matrixo.in` → Beta features (beta branch)  
- `team-auth.matrixo.in` → Employee portal only (via middleware)

## Project Structure Patterns

- **Pages**: `app/[route]/page.tsx` - Server components by default
- **Components**: `components/[domain]/` - Feature-grouped (e.g., `events/`, `home/`)
- **API Routes**: `app/api/[endpoint]/route.ts` - Use `export const dynamic = 'force-dynamic'`
- **Data**: `data/events.json` - Static event data source
- **Auth Contexts**: `lib/AuthContext.tsx` (users), `lib/employeeAuthContext.tsx` (employees)

## Critical Conventions

### Client Components
Add `'use client'` directive at top of files using hooks, Framer Motion, or browser APIs.

### Styling Patterns
Use Tailwind utility classes with custom design tokens in `globals.css`:
- `.btn-primary`, `.btn-secondary` - Button styles
- `.glass-card` - Frosted glass cards
- `.gradient-text` - Blue-to-purple gradient text
- Colors: `blue-600` primary, `gray-950` dark mode background

### Event Data Structure
Events in `data/events.json` require: `id`, `slug`, `title`, `status` (`active`/`sold-out`), `tickets[]`, `speakers[]`. TEDx events use special theming via `isTEDxEvent` check.

### Beta Feature Gating
Check `lib/config.ts` - features like SkillDNA, GrowGrid are gated by `config.features.skillDNA`. Beta links render only when `hostname === 'beta.matrixo.in'`.

## Integration Points

| Service | Config Location | Purpose |
|---------|-----------------|---------|
| Firebase Auth | `lib/firebaseConfig.ts` | User/Employee auth (Google, GitHub, email) |
| Firestore | Same file | Data persistence |
| Resend | `app/api/contact/route.ts` | Email notifications |
| Razorpay | Event registration flow | Payment processing |

## Developer Commands

```bash
npm run dev      # Start local dev server at localhost:3000
npm run build    # Production build (check for errors before commit)
npm run lint     # ESLint checks
```

## Key Files Reference

- [middleware.ts](../middleware.ts) - Subdomain routing logic
- [lib/config.ts](../lib/config.ts) - Beta vs production feature flags
- [components/events/EventDetail.tsx](../components/events/EventDetail.tsx) - Complex event page with modals, gallery, registration
- [components/Navbar.tsx](../components/Navbar.tsx) - Navigation with beta menu items
- [app/layout.tsx](../app/layout.tsx) - Root layout with AuthProvider, fonts, metadata
