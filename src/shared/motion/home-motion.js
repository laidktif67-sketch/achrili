import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const home = document.querySelector('.home-page');

if (home && !reducedMotion) {
  // Keep Lenis and ScrollTrigger on the same animation clock.
  const lenis = new Lenis({
    autoRaf: false,
    smoothWheel: true,
    anchors: true,
    syncTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  const lenisTicker = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(lenisTicker);
  gsap.ticker.lagSmoothing(0);

  // The existing hero artwork already contains the page's messaging.
  // Animate the artwork as a whole instead of duplicating or rewriting copy.
  const heroArtwork = home.querySelector('.hero img');
  if (heroArtwork) {
    gsap.fromTo(
      heroArtwork,
      { autoAlpha: 0, y: 10, filter: 'blur(8px)' },
      {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.95,
        ease: 'power2.out',
        delay: 0.08,
        clearProps: 'filter,transform',
      },
    );
  }

  // Reveal section headings and content only once as they enter the viewport.
  home.querySelectorAll('.section').forEach((section) => {
    const heading = section.querySelector('.section-title');
    const cards = section.querySelectorAll('.shop, .step');

    if (heading) {
      gsap.fromTo(
        heading,
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
          ease: 'power2.out',
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
        },
      );
    }

    if (cards.length) {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.62,
          stagger: 0.065,
          ease: 'power2.out',
          scrollTrigger: { trigger: cards[0], start: 'top 88%', once: true },
        },
      );
    }
  });

  const serviceNote = home.querySelector('.service-note');
  if (serviceNote) {
    gsap.fromTo(
      serviceNote,
      { autoAlpha: 0, y: 16 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.62,
        ease: 'power2.out',
        scrollTrigger: { trigger: serviceNote, start: 'top 90%', once: true },
      },
    );
  }

  // Reusable count-up behavior for real metrics added later.
  // No artificial statistics are inserted into the current homepage.
  home.querySelectorAll('[data-count-up]').forEach((element) => {
    const target = Number(element.dataset.countUp);
    if (!Number.isFinite(target)) return;

    const decimals = Math.max(0, Math.min(4, Number(element.dataset.decimals) || 0));
    const counter = { value: 0 };
    const original = element.textContent;
    const prefix = element.dataset.prefix || '';
    const suffix = element.dataset.suffix || '';

    ScrollTrigger.create({
      trigger: element,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          value: target,
          duration: 1.15,
          ease: 'power1.out',
          onUpdate: () => {
            element.textContent = prefix + counter.value.toLocaleString(
              document.documentElement.lang || 'ar',
              { minimumFractionDigits: decimals, maximumFractionDigits: decimals },
            ) + suffix;
          },
          onComplete: () => {
            element.textContent = prefix + target.toLocaleString(
              document.documentElement.lang || 'ar',
              { minimumFractionDigits: decimals, maximumFractionDigits: decimals },
            ) + suffix;
          },
        });
      },
    });

    // Preserve existing content if the target is invalid or animation never runs.
    if (!original) element.textContent = prefix + target + suffix;
  });

  const refresh = () => ScrollTrigger.refresh();
  if (document.readyState === 'complete') refresh();
  else window.addEventListener('load', refresh, { once: true });

  // Keep the smooth-scrolling instance tidy if this page is ever hot-reloaded.
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      gsap.ticker.remove(lenisTicker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    });
  }
}
