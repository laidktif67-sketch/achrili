# AchriLi Unified Design System

## Purpose and scope
A shared visual system for the entire AchriLi Vite multi-page application: home, authentication, product request, profile/orders, quotes, payment, help, and admin operations. It defines visual contracts, not new business logic. During migration, preserve existing API calls, Supabase behavior, validation, authorization, and payment/quote rules.

## Files and responsibilities
- `src/shared/styles/design-system.css`: public CSS entry point; load after font declarations and before feature styles. The entry point is imported by home, auth, request, profile/orders, quotes, help, admin, payment admin, customer payment, privacy, and terms. **Importing the entry point is not proof that a page is fully migrated**; feature-specific CSS remains where needed.
- `src/shared/styles/design-tokens.css`: color, typography, spacing, radius, shadow, width, control-height, focus, and z-index tokens.
- `src/shared/styles/typography.css`: text hierarchy, weights, line heights, numeric and Latin-direction helpers.
- `src/shared/styles/layouts.css`: responsive containers, stacks, rows, grid, cards, dividers, and scroll utilities.
- `src/shared/styles/components.css`: buttons, form fields, alerts, statuses, tables, empty/loading states.
- `src/shared/styles/utilities.css`: small layout, spacing, alignment, focus, and truncation helpers.

All shared classes use the `.ds-` prefix; all design tokens use `--achrili-`. This opt-in contract prevents existing feature CSS from changing unexpectedly before migration.

## Brand and semantic color
| Token | Value | Usage |
|---|---|---|
| Brand 950 | `#051744` | Deep contrast / pressed state |
| Brand 900 | `#071f5c` | Core brand and primary navigation |
| Brand 800 | `#103c8b` | Secondary brand and links |
| Accent 500 | `#ff8b19` | Main call-to-action |
| Accent 600 | `#e87508` | Hover/active accent |
| Ink | `#102754` | Main text |
| Muted | `#63718c` | Supporting text |
| Canvas | `#f7f9ff` | Page background |
| Surface | `#ffffff` | Cards, forms, tables |
| Surface soft | `#edf4ff` | Subtle panels |
| Border | `#dce6f7` | Separators and outlines |
| Success | `#12643c` / `#e7f8ee` | Completed/success |
| Danger | `#a52e27` / `#fff0ee` | Errors/destructive states |
| Warning | `#854d0e` / `#fff7e6` | Pending/attention states |

Use semantic status colors only for their meanings. Do not introduce a second palette per page.

## Typography
- Primary family: `Alexandria, Tahoma, Arial, sans-serif` (the project already loads Alexandria on primary screens).
- Weights: 400 regular, 500 medium, 600 semibold, 700 bold, 800 extrabold; use 900 only for the wordmark or a strong brand display.
- Scale: 11px micro metadata; 12px captions; 14px secondary text; 16px body; 18px card titles; 22px section headings; 28px page headings; 36px large display.
- Line heights: 1.35 headings, 1.6 normal text, 1.75 Arabic body copy.
- Use tabular numerals for prices, quantities, and dates when comparing values. Isolate Latin URLs, emails, identifiers, and codes with `.ds-latin` so RTL does not reorder them.
- Keep heading levels semantic (one primary page heading, then section headings).

## Spacing and geometry
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px.
- Radii: 4px compact, 8px small controls, 12px fields/buttons, 16px cards, 24px large hero surfaces, fully rounded pills.
- Controls target a 44px minimum height. Main content width is 1152px; narrow forms target 768px.
- Use subtle elevation; hierarchy should primarily come from alignment, spacing, and borders.
- Use logical CSS properties for RTL-safe spacing and placement.

## Component API
### Layout
`ds-container`, `ds-container--narrow`, `ds-stack`, `ds-stack--compact`, `ds-stack--loose`, `ds-row`, `ds-row--between`, `ds-row--wrap`, `ds-row--mobile-stack`, `ds-grid`, `ds-col-12`, `ds-col-8`, `ds-col-6`, `ds-col-4`.

### Surfaces and text
`ds-card`, `ds-card--flat`, `ds-page-title`, `ds-section-title`, `ds-card-title`, `ds-body`, `ds-small`, `ds-caption`, `ds-muted`, `ds-numeric`, `ds-latin`, `ds-code`, `ds-eyebrow`, `ds-divider`.

### Actions and forms
`ds-button`, `ds-button--accent`, `ds-button--secondary`, `ds-button--outline`, `ds-button--danger`, `ds-field`, `ds-label`, `ds-input`, `ds-select`, `ds-textarea`, `ds-help`.

### Feedback and data
`ds-status` with `--success`, `--danger`, `--warning`, `--neutral`; `ds-alert` with `--success`, `--danger`, `--warning`; `ds-table-wrap`, `ds-table`, `ds-empty`, `ds-skeleton`, `ds-spinner`.

### Utilities
Use the small `ds-*` utilities only when a semantic component or layout class is not appropriate. Avoid creating one-off overrides that contradict the tokens.

## Responsive, accessibility, localization
- Support viewports from 320px upward; use flexible/minmax grid tracks and min-width:0 on children.
- At widths up to 760px, stack multi-column content, reduce card padding, and allow wide tables to scroll inside their own container.
- Avoid page-wide horizontal scrolling, overlapping fixed navigation, clipped dialogs, and inaccessible off-screen actions.
- Preserve visible keyboard focus; support reduced-motion preferences; do not communicate status by color alone.
- Every form control needs a programmatic label and visible error/help text as applicable.
- Keep correct `lang` and `dir` values. Test Arabic RTL and French LTR, including numbers, prices, URLs, and email addresses.

## Admin experience principles
The admin workspace shares brand tokens but has its own information density:
- Persistent navigation for overview, requests, quotes, payments, payment methods, and only those other sections backed by real product functionality.
- A consistent top bar with current section, contextual actions, and signed-in admin state.
- Operational summary cards, filterable data tables, clear status labels, and dedicated details/edit surfaces.
- Do not place unrelated long forms in one vertical stack.
- Keep role checks, RLS, Edge Function authorization, and sensitive operations enforced server-side; visual hiding is not security.

## Current adoption status

This is an incremental migration, not a claim that every screen already uses shared components end-to-end.

| Area | Current status | Remaining work |
|---|---|---|
| Shared tokens, typography, layout, components, utilities | Implemented as the shared CSS foundation | Expand real component adoption and remove unused/duplicated rules as pages are verified |
| Privacy and terms | Migrated to shared `.ds-legal-page`, shared heading/text styles, and token-based responsive spacing; page-local inline CSS removed | Browser layout metrics show no horizontal overflow at 320, 390, and 1365px in RTL and CSS-only LTR; screenshot/pixel review remains pending |
| Authentication (login/sign-up) | Shared tokens are used for palette aliases, fields/focus, and feedback states; the two-column hero illustration and auth-specific states remain local | Adopt shared button/field primitives selectively after visual regression checks; exercise auth states in a browser |
| Profile and orders | Shared tokens now drive core palette, field borders/focus, and success/error statuses; profile navigation, order cards, and responsive layout remain feature-specific | Consolidate cards, actions, and form controls without changing profile/order logic |
| Product request and price estimator | Shared tokens now drive common palette, surfaces, and status colors; URL input, estimator, draft tools, and workflow layout remain feature-specific | Consolidate common controls while preserving price calculations and draft behavior |
| Help / FAQ | Shared tokens drive brand, surfaces, semantic notice colors, and core type/spacing; FAQ items use `.ds-card`, the notice uses `.ds-alert--warning`, and actions use `.ds-button` variants | Hero remains intentionally page-specific; screenshot/pixel review remains pending |
| Home, quotes, payments, and admin screens | Shared entry point/tokens are connected, with varying levels of primitive adoption | Audit and migrate each page in its own visual pass; do not infer full adoption from the stylesheet import |

### Validation evidence from the current implementation pass

- `npm test`: 25/25 Node tests passed in a clean Vercel sandbox checkout.
- `npm run build`: Vite build succeeded.
- `git diff --check`: passed.
- Playwright smoke test against the locally served production build: 22 route/viewport checks at 390px and 1365px in the pages' RTL mode; no HTTP failures, horizontal overflow, browser console errors, page errors, or non-font request failures were recorded. Routes that require a session redirected to the auth page as expected; their authenticated UI was therefore not exercised.
- CSS-only direction check: 22 route/viewport combinations at 390px and 1365px with `dir=ltr`, and 22 combinations at 320px in RTL/LTR; no horizontal overflow was detected. JavaScript was blocked for these forced-LTR checks, so this is layout coverage, not proof of French translations or runtime behavior on every page.
- Auth interactions: the language switch changed `lang/dir` from Arabic/RTL to French/LTR; sign-up revealed the name, confirmation, and terms fields; an empty sign-up produced the expected French validation message. No console or page errors were observed.
- Product request form: required-field validation was exercised without submitting data; no console or page errors were observed.

These are repeatable browser smoke checks, not a full screenshot-by-screenshot visual review. Authenticated profile/orders, quote, payment, and admin workflows still need a staging test account; success states and real Supabase-backed flows were not exercised. GitHub Actions Build run [41884036137](https://github.com/laidktif67-sketch/achrili/actions/runs/41884036137) on SHA `5d255dfdb7bf42cde2cdd7130bb527fcb1d80f63` completed successfully; both `build` and `postgres-migration-test` passed. The Vercel preview could not be refreshed to this branch head: Vercel rejected the deployment request with HTTP 402 `api-deployments-free-per-day` (quota exceeded). The latest Ready preview remains on runtime commit `068d4062feee45312cc168ecc04055cc261a11b5`, so it does not include the newest shared-card/alert/button markup added to Help/FAQ.

No claim of full RTL/LTR, mobile/desktop, browser-interaction, or console-error acceptance is made until those scenarios have been executed in a real browser and recorded.

## Adoption and migration
1. Load `design-system.css` on a page after its font setup and before page-specific CSS.
2. Migrate one page group at a time; replace duplicated tokens/components rather than layering endless overrides.
3. Keep workflow-specific visuals only where they communicate a distinct task or preserve required behavior.
4. Verify every route in Arabic and French, mobile and desktop, loading/empty/error/success states, keyboard navigation, and browser console.
5. Run `npm test` and `npm run build`; inspect the actual CI run for the exact commit.
6. Record browser QA evidence separately from HTTP status checks; do not mark the visual checklist complete based on HTML responses alone.

## Acceptance checklist
- [ ] Pages consume the shared tokens rather than inventing competing colors and spacing.
- [ ] Typography scale and font weights are consistent across screens.
- [ ] Shared button, field, alert, status, card, and table states are reused.
- [ ] RTL/LTR and responsive layouts work without overlap or unintended horizontal scroll.
- [ ] Existing authentication, request, quote, and payment flows remain intact.
- [ ] Build and tests pass; visual review covers key states and screen sizes.
