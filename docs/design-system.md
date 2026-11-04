# AchriLi Unified Design System

## Purpose and scope
A shared visual system for the entire AchriLi Vite multi-page application: home, authentication, product request, profile/orders, quotes, payment, help, and admin operations. It defines visual contracts, not new business logic. During migration, preserve existing API calls, Supabase behavior, validation, authorization, and payment/quote rules.

## Files and responsibilities
- `src/shared/styles/design-system.css`: public CSS entry point; load after font declarations and before feature styles.
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

## Adoption and migration
1. Load `design-system.css` on a page after its font setup and before page-specific CSS.
2. Migrate one page group at a time; replace duplicated tokens/components rather than layering endless overrides.
3. Start with admin shell, quote workflow, and payment admin; then migrate auth, request, profile, quotes/payment customer pages, home, and help.
4. Verify every route in Arabic and French, mobile and desktop, loading/empty/error/success states, and keyboard navigation.
5. Run `npm test` and `npm run build`; do not merge until results are checked.

## Acceptance checklist
- [ ] Pages consume the shared tokens rather than inventing competing colors and spacing.
- [ ] Typography scale and font weights are consistent across screens.
- [ ] Shared button, field, alert, status, card, and table states are reused.
- [ ] RTL/LTR and responsive layouts work without overlap or unintended horizontal scroll.
- [ ] Existing authentication, request, quote, and payment flows remain intact.
- [ ] Build and tests pass; visual review covers key states and screen sizes.
