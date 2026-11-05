---
name: achrili-motion-qa
description: Verify AchriLi animation changes for accessibility, responsiveness, RTL/LTR, and regression risk.
---

# AchriLi Motion QA

Run this checklist after changing motion behavior:

- [ ] `npm test` passes.
- [ ] `npm run build` builds all configured HTML entry pages.
- [ ] Homepage is checked at narrow mobile and desktop widths.
- [ ] No horizontal overflow is introduced.
- [ ] Existing Arabic copy, links, forms, and shop buttons remain unchanged and functional.
- [ ] Reduced-motion mode disables Lenis and entrance/count-up motion.
- [ ] Section reveals run once and do not leave content hidden if JavaScript fails.
- [ ] CTA remains readable, focus-visible outlines remain visible, and the effect does not block taps.
- [ ] Smooth scrolling does not interfere with bottom navigation or anchor links.
- [ ] Count-up is only used for real values and does not replace unrelated numbered steps.
- [ ] RTL layout and any existing French LTR pages remain unaffected.
- [ ] Report exact commands and actual outcomes; never describe an unrun test as passing.
