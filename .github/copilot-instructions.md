# GitHub Copilot / Agent Instructions — campusconnect-frontend

Purpose: give AI coding agents the minimal, actionable context to work on the Next.js frontend.

- **Big picture:** This is a Next.js (App Router) UI using the `app/` directory. The root layout is `app/layout.tsx` and the main entry is `app/page.tsx`. Reusable UI lives in `components/`. Mock data lives in `lib/` (e.g. `lib/mockActivities.ts`). Styling uses Tailwind and `globals.css`.

- **Run & build:**
  - Install deps: `npm install` in `campusconnect-frontend`
  - Dev server: `npm run dev` (launches Next on http://localhost:3000)
  - Build: `npm run build`, Serve: `npm run start`

- **Conventions / patterns**
  - App Router structure: add pages under `app/` (e.g. route folders like `activities`, `work/post`).
  - Shared layout: `app/layout.tsx` imports `@/components/...` (path alias configured via tsconfig).
  - Components are simple React function components in `components/` and expect props not to be mutated.
  - Local mock data for UI prototypes is read from `lib/mock*.ts`—modify these for UI changes, not backend.

- **Integration points**
  - Frontend calls the backend API (expected at `/api` or configured proxy in deployment). For local development run the backend first on its port (default 5000) and point API calls accordingly.
  - Auth: UI expects a JWT stored client-side and sends `Authorization: Bearer <token>` to protected endpoints.

- **Editing guidance for agents**
  - Prefer editing files under `app/` or `components/` for UI changes. Update `lib/` for mock data used in previews.
  - Use existing CSS utility classes (Tailwind). Avoid adding global CSS unless necessary; prefer component-level styles.

Examples:

- Add a new page route: create `app/myRoute/page.tsx` and export default a React component.
- The main navbar is `components/Navbar.tsx` and is imported in `app/layout.tsx`.

Files to inspect first: `app/layout.tsx`, `app/page.tsx`, `components/Navbar.tsx`, `lib/mockActivities.ts`.
