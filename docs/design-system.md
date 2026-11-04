# AchriLi Unified Design System

## Goal
One visual language for the entire AchriLi web app: public shopping entry, authentication, product requests, customer profile/orders, quotes, payment, help, and admin operations. This document is the implementation contract; existing business behavior and authorization must not be changed just to restyle a page.

## Current baseline observed
- Frontend is a Vite static multi-page app, not a Next.js/Tailwind app.
- Brand tokens already present in `src/shared/styles/global.css`: navy `#071f5c`, blue `#103c8b`, orange `#ff8b19`, ink `#102754`, muted `#63718c`, border `#dce6f7`.
- Alexandria is the existing primary UI font on key customer pages.
- Arabic RTL is the primary layout; French is also supported on some flows.
- Admin and payment admin currently have page-local CSS, which causes token and component drift.

## Foundations
### Color tokens
| Token | Value | Usage |
|---|---|---|
| Brand navy 900 | `#071f5c` | Main brand, headings, primary navigation |
| Brand blue 800 | `#103c8b` | Links, selected controls, secondary brand |
| Accent orange 500 | `#ff8b19` | Primary customer action and key highlights |
| Ink | `#102754` | Body text |
| Muted | `#63718c` | Secondary text, helper text |
| Canvas | `#f7f9ff` | Page background |
| Surface | `#ffffff` | Cards, forms, tables |
| Border | `#dce6f7` | Dividers and outlines |
| Success | `#12643c` / `#e7f8ee` | Successful state |
| Danger | `#a52e27` / `#fff0ee` | Errors and destructive actions |
| Warning | `#854d0e` / `#fff7e6` | Attention and pending state |

### Typography
- Font family: `Alexandria, Tahoma, Arial, sans-serif`.
- Use 12px for compact metadata, 14px for helper/body secondary content, 16px for normal body, 18px for emphasis, and 22–28px for page/section headings.
- Use clear line-height (about 1.6–1.75) for Arabic readability.
- Brand wordmark can retain its separate Latin treatment.

### Spacing, shape, elevation
- Base spacing scale: 4, 8, 12, 16, 20, 24, 32, 40px.
- Control radius: 8–12px; cards: 16px; large promotional panels: 24px; pills: fully rounded.
- Use subtle shadows only for elevation; rely on borders and spacing for hierarchy.
- Main content width target: 1152px; forms should have a readable maximum width instead of stretching edge-to-edge.

## Component contracts
Use the shared primitives in `src/shared/styles/design-system.css`:
- Layout: `.ds-container`, `.ds-stack`, `.ds-row`, `.ds-grid`.
- Surfaces: `.ds-card`, `.ds-table-wrap`.
- Actions: `.ds-button`, `.ds-button--accent`, `.ds-button--secondary`.
- Form fields: `.ds-field`, `.ds-label`, `.ds-input`, `.ds-select`, `.ds-textarea`, `.ds-help`.
- Feedback: `.ds-alert`, `.ds-status` and state variants.
- Type and dividers: `.ds-page-title`, `.ds-section-title`, `.ds-muted`, `.ds-divider`.

The `.ds-` prefix is intentional. It prevents new shared styles from unexpectedly changing legacy screens while pages are migrated.

## Responsive behavior
- Design mobile-first and support 320px+ viewports.
- At narrow widths, stack form columns, allow table containers to scroll horizontally, preserve touch targets around 44px, and avoid fixed-width controls.
- Avoid horizontal overflow, overlapping fixed navigation, and clipped dialogs.
- Respect safe-area insets on mobile and `prefers-reduced-motion`.

## RTL and localization
- Keep `lang` and `dir` correct on each page.
- Prefer logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`, `text-align: start`) rather than left/right where possible.
- Do not reverse Latin URLs, email addresses, amounts, or order identifiers.
- Keep Arabic and French labels aligned with the same component dimensions.

## Admin information architecture
Admin is a distinct workspace within the same brand system:
- Persistent navigation: Overview, Requests, Quotes, Payments, Payment methods, Customers (only if supported by current data), Settings.
- Top bar: page title, contextual actions, signed-in admin state.
- Overview: operational summary cards, pending-work queue, recent activity only where data exists.
- Data-heavy screens: searchable/filterable tables or lists, row actions, and details/forms shown in a dedicated panel or dialog—not one long stack of unrelated forms.
- Keep role checks, RLS, Edge Function authorization, and payment/quote business rules unchanged during visual migration. Never rely on hidden UI as authorization.

## Migration sequence
1. Add shared tokens and opt-in component primitives (this change).
2. Audit all pages and map each existing screen to these primitives without changing data flow.
3. Migrate the admin shell and quote/payment views; correct safe navigation to admin only after verifying role claims and redirects.
4. Migrate customer authentication, request, profile, quotes, and payment screens.
5. Run `npm test`, `npm run build`, inspect mobile/RTL states, and review all changed routes.
6. Submit as a Pull Request; do not merge to production until reviewed.

## Acceptance criteria
- Shared brand tokens are the source of truth; no new competing palettes or typography.
- Consistent buttons, form fields, alerts, status labels, cards, spacing, and headings.
- Correct RTL and French layout, no accidental visual regressions, no clipped/overlapping elements at mobile sizes.
- Existing authentication, quote creation, payment state changes, and data access remain functionally unchanged.
- Build and available tests pass.
