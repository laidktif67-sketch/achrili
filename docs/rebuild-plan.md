# AchriLi rebuild plan

## Current approach
- Preserve the existing Vite application and production Supabase project.
- Introduce Next.js web and Expo mobile applications in a separate workspace.
- Share domain types, validation schemas, and API client code through workspace packages.
- Keep the current Supabase migrations and Edge Functions untouched until source/database drift is reconciled.

## Migration gates
1. Inventory existing pages, auth flows, request/quote/payment behavior, tests, and assets.
2. Reconcile every production migration with version-controlled SQL before changing database structure.
3. Compare the deployed `admin-quotes` Edge Function with its repository source and establish one deployable source of truth.
4. Port one vertical slice at a time, beginning with authentication and product requests.
5. Run CI and acceptance tests before any production cutover.

## Environment
Use local, untracked environment files. Never commit Supabase service-role keys or production secrets.
