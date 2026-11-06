---
name: achrili-motion-design
description: Safely implement refined motion and scrolling effects in the AchriLi multi-page Vite HTML/CSS/JavaScript app.
---

# AchriLi Motion Design

## Required context
- The application is a multi-page Vite site using HTML, CSS, and JavaScript modules, not a React application.
- Preserve existing Arabic RTL and French LTR behavior, copy, brand colors, form validation, checkout/request flows, and navigation.
- The homepage motion entry point is `src/shared/motion/home-motion.js`; homepage motion styles are in `src/shared/styles/motion.css`.
- Runtime motion dependencies are GSAP and Lenis. Do not add React solely to use a React-only component library.

## Rules
1. Prefer subtle opacity, small vertical movement, blur-to-clear on existing artwork, and low-intensity light effects.
2. Use GSAP ScrollTrigger for viewport-triggered reveals; avoid replaying reveals on every scroll.
3. When using Lenis, keep it synchronized with GSAP via `gsap.ticker` and call `ScrollTrigger.update` from Lenis scroll events.
4. Respect `prefers-reduced-motion: reduce`: do not initialize smooth scrolling or GSAP entrance/count-up animations in that mode, and disable CSS motion too.
5. Never invent homepage statistics. Use `data-count-up` only for real, source-backed values.
6. Keep all visible text and existing colors unchanged unless the product owner explicitly requests a content/brand update.
7. Keep controls usable by keyboard and touch. Motion layers must not intercept pointer events or obscure focus outlines.
8. Avoid layout shifts, horizontal overflow, expensive perpetual animation, and changes to business logic.
9. React Bits components are React-based; do not paste them into this vanilla-JS site. Recreate only the specific visual treatment with lightweight CSS/GSAP, or propose a React migration separately.
10. Verify the production build and existing tests after changes. Do not claim runtime or visual QA unless it was actually run.
