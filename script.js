// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const sidebar = document.getElementById('sidebar');

navToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ===========================================================
// NAV GROUPS (Home / Art / About Me) — accordion behavior
// ===========================================================
const navGroups = document.querySelectorAll('.nav-group');
const currentPage = (location.pathname.split('/').pop() || 'index.html');
const pageGroupMap = { 'index.html': 'home', 'art.html': 'art', 'about.html': 'about' };
const currentGroupKey = pageGroupMap[currentPage] || 'home';

navGroups.forEach(group => {
  const header = group.querySelector('.nav-group-header');
  const isCurrentGroup = group.dataset.group === currentGroupKey;

  // Mark + open the group for the page we're currently on
  if (isCurrentGroup) {
    header.classList.add('current');
    group.classList.add('open');
  }

  header.addEventListener('click', (e) => {
    if (isCurrentGroup) {
      // Same page: just toggle the sublist open/closed, don't reload
      e.preventDefault();
      group.classList.toggle('open');
    }
    // Different page: let the link navigate normally; the next
    // page opens its own group automatically on load.
  });
});

// ===========================================================
// ACTIVE SUB-ITEM — scroll-position based (not IntersectionObserver)
//
// The previous version used IntersectionObserver with a narrow
// rootMargin band. That band sits away from the very top and
// very bottom of the viewport, so the first section (nothing
// above it to push it through the band on load) and the last
// section (often not enough scroll room left below it to ever
// reach the band) could never register as "intersecting" — they
// never got marked active. This version instead just compares
// each section's position to a fixed offset line under the
// mobile toggle, and explicitly forces the last section active
// once you've scrolled to the bottom of the page.
// ===========================================================
const navLinks = document.querySelectorAll('.nav-link');
const sections = Array.from(document.querySelectorAll('.panel[id]'));

const setActiveSection = (id) => {
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.section === id));
};

if (sections.length) {
  const OFFSET = 140; // px from top of viewport that counts as "current"

  const updateActiveSection = () => {
    const scrollPos = window.scrollY;
    const doc = document.documentElement;
    const atBottom = (window.innerHeight + scrollPos) >= (doc.scrollHeight - 4);

    if (atBottom) {
      setActiveSection(sections[sections.length - 1].id);
      return;
    }

    let currentId = sections[0].id;
    for (const section of sections) {
      const top = section.getBoundingClientRect().top + scrollPos;
      if (scrollPos + OFFSET >= top) {
        currentId = section.id;
      }
    }
    setActiveSection(currentId);
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveSection();
        ticking = false;
      });
      ticking = true;
    }
  });
  window.addEventListener('resize', updateActiveSection);

  updateActiveSection();
} else {
  // No in-page sections on this page — just mark the current page's group link
  const pageLink = document.querySelector(`.nav-group-header[data-page="${currentGroupKey}"]`);
  if (pageLink) pageLink.classList.add('current');
}

// ===========================================================
// SLIDE GALLERIES (Experience project media)
// Builds dot indicators, wires prev/next buttons, and keeps the
// active dot in sync with scroll position via scroll-snap.
// ===========================================================
document.querySelectorAll('.slide-gallery').forEach(gallery => {
  const track = gallery.querySelector('.slide-track');
  const slides = Array.from(gallery.querySelectorAll('.slide'));
  const dotsWrap = gallery.querySelector('.slide-dots');
  const prevBtn = gallery.querySelector('.slide-prev');
  const nextBtn = gallery.querySelector('.slide-next');
  if (!track || !slides.length) return;

  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.className = 'slide-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => {
      track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  const setActiveDot = () => {
    let closestIdx = 0;
    let closestDist = Infinity;
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.offsetLeft - track.scrollLeft);
      if (dist < closestDist) { closestDist = dist; closestIdx = i; }
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === closestIdx));
  };

  let scrollTicking = false;
  track.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => { setActiveDot(); scrollTicking = false; });
      scrollTicking = true;
    }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const isLastSlide = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    track.scrollTo({ left: isLastSlide ? 0 : track.scrollLeft + track.clientWidth, behavior: 'smooth' });
  });

  setActiveDot();

  if (gallery.classList.contains('jam-cover-gallery') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let autoplayTimer;
    const advanceSlide = () => {
      const isLastSlide = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      track.scrollTo({ left: isLastSlide ? 0 : track.scrollLeft + track.clientWidth, behavior: 'smooth' });
    };
    const startAutoplay = () => {
      if (!autoplayTimer) autoplayTimer = setInterval(advanceSlide, 4500);
    };
    const pauseAutoplay = () => {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    };

    gallery.addEventListener('mouseenter', pauseAutoplay);
    gallery.addEventListener('mouseleave', startAutoplay);
    gallery.addEventListener('focusin', pauseAutoplay);
    gallery.addEventListener('focusout', (event) => {
      if (!gallery.contains(event.relatedTarget)) startAutoplay();
    });
    startAutoplay();
  }
});
