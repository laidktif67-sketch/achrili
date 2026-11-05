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
| Authentication (login/sign-up) | Shared tokens are used for palette aliases, fields/focus, and feedback states; auth page has an Arabic/French language toggle and a two-column hero illustration | Adopt shared button/field primitives selectively after visual regression checks; full visual review and real backend auth states remain pending |
| Profile and orders | Shared tokens drive core palette, field borders/focus, and success/error statuses; profile includes Arabic/French language selection, while navigation/order cards remain feature-specific | Consolidate cards, actions, and form controls without changing profile/order logic; authenticated data flows remain untested |
| Product request and price estimator | Shared tokens drive common palette, surfaces, and status colors; request page includes Arabic/French translation, while URL input, estimator, draft tools, and workflow layout remain feature-specific | Consolidate common controls while preserving price calculations and draft behavior; live pricing and request submission remain untested |
| Help / FAQ | Shared tokens drive brand, surfaces, semantic notice colors, and core type/spacing; FAQ items use `.ds-card`, the notice uses `.ds-alert--warning`, and actions use `.ds-button` variants | Hero remains intentionally page-specific; screenshot/pixel review remains pending |
| Home, quotes, payments, and admin screens | Shared entry point/tokens are connected, with varying levels of primitive adoption | Audit and migrate each page in its own visual pass; do not infer full adoption from the stylesheet import |

### Validation evidence from the current implementation pass

- Application/browser QA was captured from application code SHA `9880845e818d9d5d5485a10f5db64b1c75ea3d50` on `design/achrili-unified-design-system`. Subsequent commits in this pass changed only documentation/evidence files; no application code changed. The current branch head is checked separately because documentation-only commits do not rerun the app behavior. PR #13 remains open and draft; no merge or production deployment was performed.
- GitHub Actions run [41983841593](https://github.com/laidktif67-sketch/achrili/actions/runs/41983841593) on application SHA `9880845e818d9d5d5485a10f5db64b1c75ea3d50` completed successfully. The later docs-only head also passed GitHub Actions in run [41988142753](https://github.com/laidktif67-sketch/achrili/actions/runs/41988142753): both `build` and `postgres-migration-test` passed. The build job ran unit tests, built all HTML pages, type-checked the admin quote Edge Function, and checked its HTTP error contract. The database job applied the quote migration and passed PostgreSQL integration and concurrent quote-creation assertions.
- In an isolated sandbox checked out at the same SHA, `npm test` passed **25/25**; `npm run build` passed and built all 11 HTML entry pages; `git diff --check` passed. This repository has no `package-lock.json`, so `npm ci` is not applicable; the isolated check used `npm install --no-package-lock`. No dependency or application files were changed by these checks.
- Playwright generated **28 full-page screenshots** from the isolated local build: 11 routes at desktop (1365×900) and mobile (390×844) in Arabic/RTL, plus French/LTR captures at both sizes for the three pages that implement a language switch: authentication, product request, and profile. The product-request page's full-page captures completed in this run. Browser metrics reported no horizontal overflow at these captured widths, no route redirects in the screenshot run, and no page-level JavaScript errors. Each of the 28 individual captures was then visually inspected in seven labeled panels (not only the composite index), at reduced preview resolution. This was a layout review, not full-resolution pixel-difference or accessibility certification.
- For protected-page screenshots, a synthetic local session was used only to render the page shell; all Supabase network requests were explicitly blocked. Therefore loading/error states may reflect unavailable backend calls, and these screenshots do **not** prove authentication, authorization, live data, successful quote/order/payment flows, or production behavior. No production data was read or mutated.
- The auth language toggle was exercised previously: Arabic/RTL changed to French/LTR, sign-up revealed name/password-confirmation/terms fields, and empty submission showed required-name validation. Request and profile locale captures now also confirm actual `lang="fr"` and `dir="ltr"` on their French views. Other pages in this PR do not expose a French translation toggle; forcing LTR alone is not counted as French localization.
- Vercel project settings show SSO protection enabled (`all_except_custom_domains`), no visible project environment variables, and no custom Staging environment. Vercel deployment metadata repeatedly confirmed a `READY` preview for the branch head at the time of each check; the stable branch preview alias is [here](https://achrili-main-git-design-achrili-unified-design-system-nino-1c9d.vercel.app). Direct requests to the application preview redirect to Vercel SSO, so deployed page content could not be independently inspected. The temporary screenshot gallery is separately reachable for the current review, but is not a durable artifact. Deployment metadata is not page-functionality evidence. No protection bypass or security-setting change was attempted.
- A repository copy of `docs/qa-screenshots/index.html` provides a durable embedded composite/contact sheet. The 28 original individual PNGs, ZIP archive, and full `results.json` were generated in the isolated QA sandbox and exposed through a temporary route; those originals and the archive are **not committed**, so their links are ephemeral. The deployed application preview remains SSO-protected. No staging credentials or authorized application-preview access were supplied. No signed-in staging workflow, role-denial test against a real backend, or success/failure mutation path was run.

**Visual review observations (all 28 captures):** home desktop/mobile layouts retained their hero, store grid, steps, and bottom navigation without detected overflow; auth Arabic/French forms and hero panels remained readable; request forms were long but complete in both Arabic and French at desktop/mobile; profile forms/cards aligned in both supported locales; quotes and customer-payment pages showed the expected explanatory/empty/error content in both viewports; help cards and legal text remained within the viewport; admin and payment-admin pages rendered their shells. Admin/quote/payment-admin screenshots also show failed backend requests because Supabase/Edge Function calls were deliberately blocked in the QA harness. Those messages are test-environment effects and do not prove the real backend is failing; no CSS or business-logic changes were justified by this visual pass. No confirmed overlap, clipping, or horizontal-scroll defect was found in the inspected previews. The contact-sheet index is durable, but the original images/ZIP still need to be added to a durable review artifact.

**Status:** CI, local tests/build, and the 28-capture visual review passed within the stated scope. The PR is **not merge-ready**: deployed page content remains unverified because of SSO; the full-resolution image archive is not durably stored; French localization is implemented only on authentication, product request, and profile among the pages checked; and authenticated staging/role/payment/order flows remain untested. Do not treat a redirect, a successful build, synthetic screenshot session, or HTTP status as proof that protected functionality works.

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


## Current verification artifact

- Durable review index: [`docs/qa-screenshots/index.html`](./qa-screenshots/index.html). It embeds a labeled overview of all 28 captures and records what was and was not validated. Full-resolution originals remain temporary and should not be treated as retained evidence.
