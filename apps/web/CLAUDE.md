# Web Frontend (Next.js)

## Overview

Next.js 15.4.2 web application using App Router with Turbopack dev server. React 19, TypeScript 5.8. Serves the entire user-facing UI for the AI Video Interview platform including marketing pages, authentication flows, role-based dashboards (Admin, HR, Candidate), interview recording, and AI review results.

- **Port**: 3000
- **API Gateway**: All API calls go through `http://localhost:8001` (never directly to microservices)
- **Auth**: httpOnly cookies (`access_token`, `refresh_token`) set by API Gateway

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15.4.2 (App Router, Turbopack) |
| UI Library | React 19.1 |
| Language | TypeScript 5.8.2 |
| Styling | Tailwind CSS 4.1, tailwind-merge, tailwindcss-animate |
| Components | shadcn/ui + Radix UI primitives, Framer Motion |
| Forms | React Hook Form 7 + @hookform/resolvers 5 + Zod 4 |
| Data Fetching | @tanstack/react-query 5.90 |
| Drag & Drop | @dnd-kit/core 6, @dnd-kit/sortable 10 |
| Icons | lucide-react |
| Theming | next-themes (dark mode) |
| Toasts | sonner |
| Auth Utils | jwt-decode |

## Commands

```bash
pnpm --filter web dev          # Start dev server (Turbopack, port 3000)
pnpm --filter web build        # Production build
pnpm --filter web start        # Start production server
pnpm --filter web lint         # ESLint
pnpm --filter web check-types  # TypeScript type checking (tsc --noEmit)
```

## Directory Structure

```
apps/web/
  app/                          # Next.js App Router
    layout.tsx                  # Root layout (providers, fonts, ThemeProvider)
    (marketing)/                # Public marketing pages (landing, about, pricing)
      layout.tsx
    (auth)/                     # Auth pages (login, register, callback, select-role)
      layout.tsx
      select-role/              # Post-registration role selection (pending users)
    (app)/                      # Authenticated app shell
      layout.tsx                # Sidebar + header layout
      dashboard/                # Role-based dashboard redirect
      admin/                    # Admin: users, skills, interviews management
        layout.tsx
      hr/                       # HR: templates, interviews, companies, candidates
        layout.tsx
        interviews/
          layout.tsx
      candidate/                # Candidate: dashboard, profile, skills
        layout.tsx
      profile/                  # Shared profile page
        layout.tsx
    (interview)/                # Interview flow (separate layout, no sidebar)
      layout.tsx
      interview/[invitationId]/ # Interview recording page
  features/                     # Feature modules
    auth/                       # Login, register, OAuth callback, useAuth hook
    interviews/                 # Interview CRUD, status management, AI review
    templates/                  # Interview template builder with drag-and-drop
    candidates/                 # Candidate management (admin/HR view)
    companies/                  # Company management
    skills/                     # Skill taxonomy management
    profile/                    # User profile editing
    users/                      # User administration (admin)
    hr-candidates/              # HR-specific candidate views
    candidate-skills/           # Candidate skill self-assessment
  components/
    ui/                         # shadcn/ui components (button, card, dialog, input, etc.)
    layout/                     # App shell components (sidebar, header, navigation)
  lib/
    api.ts                      # Base API client (apiGet, apiPost, apiPut, apiPatch, apiDelete)
    api/                        # Per-resource API functions
    hooks/                      # Shared hooks
    types/                      # Shared TypeScript types
    constants/                  # App constants
  middleware.ts                 # Auth middleware (token check, role-based route protection)
```

## Architecture Patterns

### Feature-Based Organization

Each feature module in `features/` follows a consistent internal structure:

```
features/<feature>/
  types/          # Feature-specific TypeScript interfaces and types
  components/     # Feature-specific React components
  hooks/          # React Query hooks, custom hooks
  services/       # API call functions (using lib/api.ts helpers)
```

### API Layer

`lib/api.ts` provides typed HTTP helpers that all go through the API Gateway:

- `apiGet<T>(path)` / `apiPost<T>(path, body)` / `apiPut<T>(path, body)` / `apiPatch<T>(path, body)` / `apiDelete<T>(path)`
- All requests include `credentials: 'include'` for httpOnly cookies
- Automatic 401 handling: on 401, attempts token refresh via `POST /auth/refresh`, then retries the original request
- Concurrent refresh requests are deduplicated (single in-flight refresh)
- Throws `ApiError` with `statusCode`, `code`, and `details` for structured error handling

### Authentication Flow

1. **Middleware** (`middleware.ts`): First line of defense. Checks for `access_token` or `refresh_token` cookies. Redirects unauthenticated users to `/login`. Enforces role-based route access (admin, hr, candidate). Redirects `pending` users to `/select-role`.
2. **Client-side**: `useAuth()` hook from `features/auth/` manages auth state. Token refresh happens transparently in `lib/api.ts`.
3. **Roles**: `admin`, `hr`, `candidate`, `pending`. Decoded from JWT `realm_access.roles` claim.

### Data Fetching

- All data fetching uses `@tanstack/react-query` hooks
- Each feature defines its own query hooks (e.g., `useInterviews()`, `useTemplate(id)`)
- Mutations use `useMutation` with `onSuccess` callbacks that invalidate related queries
- No raw `useEffect` + `fetch` patterns

### Forms

- React Hook Form for form state management
- Zod 4 schemas for validation (integrated via `@hookform/resolvers`)
- Controller components for complex inputs

## Rules

1. **App Router only** -- no `pages/` directory, no `getServerSideProps`/`getStaticProps`
2. **Server Components by default** -- add `'use client'` only when the component needs interactivity (hooks, event handlers, browser APIs)
3. **All API calls through API Gateway** (port 8001) -- never call microservices directly
4. **React Query for all data fetching** -- no `useEffect` + `fetch` patterns
5. **Forms: React Hook Form + Zod** -- no uncontrolled forms, no manual validation
6. **Feature modules in `features/`** -- shared UI only in `components/`
7. **Tailwind CSS 4 syntax** -- use `@import "tailwindcss"` not `@tailwind` directives
8. **`next/link` for navigation** -- no `<a>` tags for internal links
9. **`next/image` for images** -- no raw `<img>` tags
10. **Loading states via `loading.tsx`** or React Query `isLoading`/`isPending`
11. **Error handling via `error.tsx`** boundary files per route segment

## Skills & Best Practices

### Next.js 15 App Router

- **Route groups** `(marketing)`, `(app)`, `(auth)`, `(interview)` organize routes without affecting URL paths. Each group has its own `layout.tsx` for distinct visual shells (marketing has no sidebar; app has sidebar+header; interview has minimal chrome).
- **Layouts are persistent** across navigation within the same segment. Put shared UI (sidebar, header) in `layout.tsx`, not in individual pages. Layouts do NOT re-render when child routes change.
- **`loading.tsx`** creates an automatic Suspense boundary. Place one in each route group for instant loading UI. For more granular control, use `<Suspense>` directly in Server Components.
- **`error.tsx`** must be a Client Component (`'use client'`). It receives `error` and `reset` props. Place at route group level for catch-all error handling, or per-page for specific recovery logic.
- **Streaming**: Server Components that await data automatically stream. Wrap slow data fetches in `<Suspense>` to show the rest of the page immediately. Use `loading.tsx` for full-page streaming boundaries.
- **Parallel routes** (`@slot`): Use for rendering multiple independently-loading page sections (e.g., dashboard with multiple data panels). Each slot can have its own `loading.tsx` and `error.tsx`.
- **Intercepting routes** (`(.)`, `(..)`, `(...)`): Use for modal patterns where a route renders as a modal when navigated from within the app, but as a full page when accessed directly (e.g., photo gallery, detail views).
- **`generateMetadata`** for SEO: Export async `generateMetadata` from page/layout files. Never use `<Head>` from `next/head`.
- **Route handlers**: Use `route.ts` files in `app/api/` for server-side API endpoints when needed (rare in this project since the API Gateway handles everything).

### React 19 Patterns

- **Server Components vs Client Components decision tree**:
  - Default to Server Component unless you need: `useState`, `useEffect`, `useRef`, event handlers (`onClick`, `onChange`), browser APIs (`window`, `document`), React Query hooks, React Hook Form, or third-party client-only libraries.
  - Server Components can import Client Components but not vice versa. Pass Server Component content to Client Components via `children` or other React node props.
  - Keep Client Components as leaf nodes in the component tree. Push `'use client'` boundaries as deep as possible.
- **Transitions** (`useTransition`, `startTransition`): Wrap non-urgent state updates (e.g., filtering a list, tab switching) in `startTransition` to keep the UI responsive. React Query's mutations handle this automatically.
- **`use()` hook**: Can unwrap promises and context in render. Use for reading context without `useContext`. For data fetching, prefer React Query over raw `use(fetch(...))`.
- **Server Actions**: Define with `'use server'` directive. Use for form submissions that need server-side processing. In this project, most mutations go through the API Gateway via React Query, so server actions are used sparingly (e.g., revalidation triggers).

### React Query Best Practices

- **Query key factories**: Define query keys as factory objects per feature to ensure consistency and enable targeted invalidation:
  ```typescript
  export const templateKeys = {
    all: ['templates'] as const,
    lists: () => [...templateKeys.all, 'list'] as const,
    list: (filters: TemplateFilters) => [...templateKeys.lists(), filters] as const,
    details: () => [...templateKeys.all, 'detail'] as const,
    detail: (id: string) => [...templateKeys.details(), id] as const,
  };
  ```
- **Prefetching**: Use `queryClient.prefetchQuery` in Server Components or `prefetchQuery` in `loader` functions to avoid waterfalls. For list-to-detail navigation, prefetch detail data on hover.
- **Optimistic updates**: For mutations where immediate UI feedback matters (toggling status, reordering), use `onMutate` to update the cache optimistically and `onError` to rollback:
  ```typescript
  useMutation({
    mutationFn: updateTemplate,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.detail(id) });
      const previous = queryClient.getQueryData(templateKeys.detail(id));
      queryClient.setQueryData(templateKeys.detail(id), newData);
      return { previous };
    },
    onError: (_err, _new, context) => {
      queryClient.setQueryData(templateKeys.detail(id), context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
    },
  });
  ```
- **Mutation side effects**: Always invalidate related queries in `onSuccess` or `onSettled`. Use `queryClient.invalidateQueries` with the broadest relevant key prefix.
- **Infinite queries**: For paginated lists, use `useInfiniteQuery` with `getNextPageParam`. Flatten pages with `data.pages.flatMap(p => p.items)`.
- **Error handling**: Set a global `QueryCache` error handler for toast notifications. Use `throwOnError` sparingly and only with error boundaries.
- **Stale time**: Set `staleTime` per query based on data freshness needs. User profile: 5 minutes. Interview list: 30 seconds. Reference data (skills): 10 minutes.

### Tailwind CSS 4 Best Practices

- **New import syntax**: Use `@import "tailwindcss"` in the main CSS file instead of `@tailwind base/components/utilities` directives. Tailwind 4 uses CSS-native features.
- **Design tokens**: Define custom values with `@theme` in CSS:
  ```css
  @theme {
    --color-brand: #6366f1;
    --radius-card: 0.75rem;
  }
  ```
- **Responsive patterns**: Mobile-first approach. Use `sm:`, `md:`, `lg:`, `xl:` breakpoint prefixes. Prefer `flex` and `grid` layouts over absolute positioning.
- **Dark mode**: Configured via `next-themes` provider with `attribute="class"`. Use `dark:` variant for dark mode styles. The `ThemeProvider` wraps the root layout.
- **Component variants**: Use `class-variance-authority` (CVA) for component variant definitions. Combined with `tailwind-merge` via `cn()` utility for safe class merging:
  ```typescript
  import { cn } from '@/lib/utils';
  <div className={cn("base-classes", conditional && "conditional-classes", className)} />
  ```
- **Animations**: Use `tailwindcss-animate` for enter/exit animations. Use Framer Motion for complex choreographed animations (page transitions, list reordering, modals).

### shadcn/ui Patterns

- **Component customization**: shadcn/ui components live in `components/ui/` and are fully editable source code (not a library). Modify them directly to match design needs.
- **Extending primitives**: Build feature-specific components by composing shadcn/ui primitives. Example: build a `TemplateCard` from `Card`, `Badge`, `Button`, and `DropdownMenu`.
- **Composition patterns**: Use Radix UI's composition model. Components expose `asChild` prop for render delegation via `Slot`. Use `forwardRef` when wrapping interactive components.
- **Available components**: avatar, badge, button, card, dialog, dropdown-menu, input, label, logo, separator, skeleton, sonner (toasts), textarea. Add new shadcn/ui components via: `npx shadcn@latest add <component>`.

### Form Patterns (React Hook Form + Zod)

- **Schema-first**: Define Zod 4 schemas first, then derive TypeScript types with `z.infer<typeof schema>`. Use the schema in the resolver:
  ```typescript
  const schema = z.object({
    title: z.string().min(1, 'Title is required'),
    questions: z.array(questionSchema).min(1),
  });
  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', questions: [] },
  });
  ```
- **Field arrays**: Use `useFieldArray` for dynamic form sections (adding/removing questions in templates, skills in profile). Combine with `@dnd-kit` for drag-and-drop reordering.
- **Server-side validation**: When the API returns validation errors, map them to form fields using `form.setError('fieldName', { message })`. Show API error messages inline in the form, not just as toasts.
- **Progressive disclosure**: Use multi-step forms for complex flows. Track step state in React state, validate per-step with partial Zod schemas.
- **Controlled components**: Use `Controller` for Radix UI `Select`, `Switch`, and other components that don't expose a native `ref`.

### Authentication Patterns

- **Middleware protection**: `middleware.ts` runs on every non-static request. It decodes the JWT access token to extract roles and enforces route-level access. This is a fast check (no API calls) that prevents unauthorized page loads.
- **Role-based access**: Three role-protected route prefixes: `/admin` (admin only), `/hr` (hr only), `/candidate` (candidate only). Shared routes like `/dashboard` and `/profile` are accessible to all authenticated users.
- **Token refresh flow**: When `lib/api.ts` receives a 401, it calls `POST /auth/refresh` with the httpOnly refresh token cookie. If successful, the API Gateway sets new cookies and the original request is retried transparently. Concurrent 401s share a single refresh attempt.
- **Session management**: Tokens are httpOnly cookies set by the API Gateway. The frontend never reads or stores tokens directly (except for role decoding in middleware using `atob`). Logout clears cookies via `POST /auth/logout`.
- **Pending user flow**: New users get the `pending` role. Middleware redirects them to `/select-role`. After role selection, the API Gateway updates their role and issues new tokens.

### Performance Patterns

- **Code splitting**: Next.js automatically code-splits by route. Use `next/dynamic` for heavy components that should not be in the initial bundle (e.g., rich text editors, chart libraries).
- **Lazy loading**: Use `React.lazy()` with `<Suspense>` for client components that are below the fold. Framer Motion's `LazyMotion` reduces the initial animation bundle.
- **Image optimization**: Always use `next/image` with explicit `width`/`height` or `fill` prop. Use `priority` for above-the-fold hero images. Configure `remotePatterns` in `next.config.ts` for external image domains.
- **Font optimization**: Use `next/font/google` or `next/font/local` for automatic font optimization (self-hosting, preloading, no layout shift).
- **Bundle analysis**: Run `ANALYZE=true pnpm build` (requires `@next/bundle-analyzer`). Watch for large dependencies accidentally imported in Client Components.
- **React Query caching**: Leverage React Query's cache to avoid redundant network requests. Set appropriate `staleTime` and `gcTime` per query type.

### Accessibility

- **Radix UI aria patterns**: Radix UI primitives (Dialog, DropdownMenu, etc.) handle ARIA attributes, keyboard navigation, and focus trapping automatically. Do not override these with custom implementations.
- **Keyboard navigation**: All interactive elements must be reachable via Tab. Dialogs trap focus. Dropdown menus support arrow keys. Use `@dnd-kit`'s keyboard sensors for accessible drag-and-drop.
- **Screen reader support**: Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`). Add `aria-label` to icon-only buttons. Use `sr-only` class for visually hidden but screen-reader-accessible text.
- **Focus management**: After route navigation or modal close, return focus to the trigger element. Use `autoFocus` prop on the first input in forms and dialogs.
- **Color contrast**: Ensure all text meets WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text). Test both light and dark themes.

### Testing Frontend

- **React Testing Library**: Test components by user behavior, not implementation details. Query by role, label text, or placeholder text -- never by class name or test ID (unless no better option).
- **MSW (Mock Service Worker)**: Mock API responses at the network level for integration tests. Define handlers that match the API Gateway routes. Avoids coupling tests to implementation.
- **Component testing strategy**: Unit-test utility functions and hooks directly. Integration-test feature components with their React Query providers and mocked API. E2E test critical flows (login, interview recording, template creation) with Playwright or Cypress.
- **Test structure**: Co-locate test files with source: `features/templates/components/__tests__/TemplateBuilder.test.tsx`. Use `describe` blocks per component and `it` blocks per behavior.
- **Snapshot testing**: Avoid snapshot tests for dynamic components. Use them sparingly for static UI elements that should not change unintentionally.

### Error Handling & User Experience

- **Optimistic UI with rollback**: For user actions that should feel instant (toggling a status, reordering questions), update the UI immediately via React Query's `onMutate`, show a subtle loading indicator, and rollback on error. Show the error as a toast, not an alert.
- **Error boundary hierarchy**: Place `error.tsx` at route group level (`(app)/error.tsx`) for catch-all errors, and per-feature for specific recovery (e.g., `hr/interviews/error.tsx` can offer "retry loading interviews"). Always provide a "Try again" button that calls the `reset` prop.
- **Network error handling**: Detect offline state via `navigator.onLine` or React Query's `onlineManager`. Show a persistent banner when offline. Queue mutations when offline and replay when back online (React Query handles this with `networkMode: 'offlineFirst'`).
- **Loading state hierarchy**: Show skeleton UI (`loading.tsx`) for initial page loads. Show inline spinners for action buttons. Show progress bars for multi-step operations (interview progress, file upload). Never block the entire page for a single data fetch.
- **Toast patterns**: Use `sonner` for non-blocking notifications. Success toasts auto-dismiss (3s). Error toasts persist until dismissed. Action toasts include an "Undo" button for destructive operations (delete template, remove question). Never stack more than 3 toasts.

### State Management Architecture

- **React Query as primary state**: Server state lives in React Query cache. No global state management library (Redux, Zustand) is needed. React Query handles caching, deduplication, background refetching, and optimistic updates.
- **URL state for filters/pagination**: Use URL search params (`useSearchParams`) for filter state, pagination, and sort order. This makes filtered views shareable and bookmarkable. Sync URL params with React Query keys.
- **Local state for UI**: Use `useState` for ephemeral UI state (modal open/close, dropdown selection, form step). Use `useReducer` for complex local state with multiple related updates.
- **Context for cross-cutting concerns**: Use React Context for theme, locale, and auth state. Never put frequently-changing data in context (it re-renders all consumers). For performance-critical contexts, use `useMemo` on the value or split into multiple contexts.

### Internationalization Readiness

- **Text extraction**: All user-facing text should be extracted to constants or i18n keys, not hardcoded in JSX. This prepares for future internationalization (Russian, English, German as specified in notification service spec).
- **Date/time formatting**: Use `Intl.DateTimeFormat` or a library like `date-fns` with locale support. Store dates in UTC on the server, format in the user's timezone on the client. The profile feature already has timezone preferences.
- **Number formatting**: Use `Intl.NumberFormat` for scores (0-100) and percentages. Different locales format numbers differently (1,234.56 vs 1.234,56).
- **RTL readiness**: Use logical CSS properties (`margin-inline-start` instead of `margin-left`) and Tailwind's `rtl:` variant for future RTL language support. This is low effort now but expensive to retrofit later.

### Security (Frontend Specific)

- **XSS prevention**: React auto-escapes JSX content. Never use `dangerouslySetInnerHTML` except for sanitized rich text. Sanitize any user-generated content displayed back (candidate responses, interview feedback).
- **CSRF protection**: With `SameSite=Strict` httpOnly cookies, CSRF is mitigated. The API Gateway also validates the `Origin` header on state-changing requests. No CSRF tokens needed in the frontend.
- **Content Security Policy**: Configure CSP headers (via nginx or Next.js) to prevent XSS: `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (needed for Tailwind), `img-src 'self' blob: data:` (for MinIO images and camera previews).
- **Sensitive data**: Never store tokens in localStorage or sessionStorage. Tokens are in httpOnly cookies (set by API Gateway, not accessible to JS). The middleware decodes tokens only for role checking — never expose token content to client components.
