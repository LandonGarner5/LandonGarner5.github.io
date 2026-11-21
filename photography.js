'use strict';
(() => {
  const photos = window.PORTFOLIO_PHOTOS || [];
  const tabs = [...document.querySelectorAll('[data-work-view]')];
  const panels = {photo: document.querySelector('#photo'), video: document.querySelector('#video'), design: document.querySelector('#design')};
  const morePhotos = document.querySelector('#photo-more-grid');
  const seeMore = document.querySelector('#photo-see-more');
  const photoCount = document.querySelector('#photo-count');
  const previewCount = document.querySelectorAll('#photo-preview-grid [data-photo]').length;
  const photoGallery = document.querySelector('#photo-gallery');
  const photoCards = [...photoGallery.querySelectorAll('[data-photo]')];
  const previewCards = photoCards.filter(card => !morePhotos.contains(card));
  const imageRatios = new Map(photoCards.map(card => {
    const image = card.querySelector('img');
    return [card, Number(image.getAttribute('height')) / Number(image.getAttribute('width'))];
  }));
  let galleryWidth = 0;
  function layoutPhotos() {
    const width = photoGallery.clientWidth;
    if (!width) return;
    galleryWidth = width;
    const style = getComputedStyle(photoGallery);
    const columns = Number(style.getPropertyValue('--photo-columns'));
    const gap = parseFloat(style.columnGap);
    const cardWidth = (width - gap * (columns - 1)) / columns;
    const previewColumns = new Map();
    const plannedHeights = Array(columns).fill(0);
    const columnRatios = Array(columns).fill(0);
    const columnCounts = Array(columns).fill(0);
    previewCards.forEach(card => {
      const column = plannedHeights.indexOf(Math.min(...plannedHeights));
      previewColumns.set(card, column);
      plannedHeights[column] = Math.ceil(plannedHeights[column]) + cardWidth * imageRatios.get(card) + gap;
      columnRatios[column] += imageRatios.get(card);
      columnCounts[column] += 1;
    });
    let columnWidths = Array(columns).fill(cardWidth);
    if (columns === 3 && columnRatios.every(ratio => ratio > 0)) {
      // Slightly vary desktop column widths so the opening photos end together.
      const columnGaps = columnCounts.map(count => (count - 1) * gap);
      const commonHeight = (width - gap * (columns - 1)
        + columnRatios.reduce((sum, ratio, index) => sum + columnGaps[index] / ratio, 0))
        / columnRatios.reduce((sum, ratio) => sum + 1 / ratio, 0);
      columnWidths = columnRatios.map((ratio, index) => (commonHeight - columnGaps[index]) / ratio);
    }
    photoGallery.style.gridTemplateColumns = columnWidths.map(value => `${value}px`).join(' ');
    const heights = Array(columns).fill(0);
    // Keep the opening layout fixed, then continue into the shortest column.
    photoCards.forEach(card => {
      if (morePhotos.hidden && morePhotos.contains(card)) return;
      const column = previewColumns.get(card) ?? heights.indexOf(Math.min(...heights));
      const height = columnWidths[column] * imageRatios.get(card);
      const top = Math.ceil(heights[column]);
      card.style.gridColumn = String(column + 1);
      card.style.gridRow = `${top + 1} / span ${Math.ceil(height)}`;
      heights[column] = top + height + gap;
    });
    photoGallery.classList.add('is-masonry');
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      if (photoGallery.clientWidth !== galleryWidth) layoutPhotos();
    }).observe(photoGallery);
  } else {
    window.addEventListener('resize', layoutPhotos);
  }
  seeMore.addEventListener('click', () => {
    const scrollPosition = {top: window.scrollY, left: window.scrollX};
    const expanded = seeMore.getAttribute('aria-expanded') !== 'true';
    morePhotos.hidden = !expanded;
    seeMore.setAttribute('aria-expanded', String(expanded));
    seeMore.textContent = expanded ? 'See less' : 'See more';
    photoCount.textContent = expanded ? `${photos.length} photographs` : `${previewCount} of ${photos.length} photographs`;
    layoutPhotos();
    if (expanded) {
      morePhotos.querySelector('[data-photo]')?.focus({preventScroll: true});
      requestAnimationFrame(() => window.scrollTo({...scrollPosition, behavior: 'instant'}));
    } else {
      requestAnimationFrame(() => seeMore.scrollIntoView({block: 'center', behavior: 'instant'}));
    }
  });
  function selectView(name, focus = false) {
    if (!panels[name]) return;
    Object.entries(panels).forEach(([key, panel]) => {
      panel.hidden = key !== name;
      if (panel.hidden) panel.querySelectorAll('video').forEach(video => video.pause());
    });
    tabs.forEach(tab => {
      const active = tab.dataset.workView === name;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    if (name === 'photo') layoutPhotos();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectView(tab.dataset.workView);
      history.replaceState(null, '', `#${tab.dataset.workView}`);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectView(tabs[next].dataset.workView, true);
      history.replaceState(null, '', `#${tabs[next].dataset.workView}`);
    });
  });
  document.querySelectorAll('a[href="#photo"], a[href="#video"], a[href="#design"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const name = link.getAttribute('href').slice(1);
      selectView(name);
      history.pushState(null, '', `#${name}`);
      document.querySelector('#work').scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    });
  });
  function restoreView() {
    const name = location.hash.slice(1);
    if (panels[name]) selectView(name);
  }
  window.addEventListener('hashchange', restoreView);
  window.addEventListener('popstate', restoreView);
  selectView(panels[location.hash.slice(1)] ? location.hash.slice(1) : 'photo');
  if (panels[location.hash.slice(1)]) {
    requestAnimationFrame(() => document.querySelector('#work').scrollIntoView({block: 'start', behavior: 'instant'}));
  }
  // Position section links after the photo layout has its final height.
  function alignSectionLink() {
    const section = location.hash.slice(1);
    if (section === 'about' || section === 'contact') {
      document.getElementById(section).scrollIntoView({block: 'start', behavior: 'instant'});
    }
  }
  requestAnimationFrame(alignSectionLink);
  window.addEventListener('load', alignSectionLink, {once: true});
  const lightbox = document.querySelector('#photo-dialog');
  const image = document.querySelector('#photo-full-image');
  const caption = document.querySelector('#photo-caption');
  const position = document.querySelector('#photo-position');
  const close = document.querySelector('#close-photo');
  let current = 0;
  let returnFocus = null;
  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.alt = photo.alt;
    image.width = photo.large.width;
    image.height = photo.large.height;
    image.src = photo.large.src;
    caption.textContent = photo.caption || photo.alt;
    position.textContent = `Photo ${String(current + 1).padStart(2, '0')} / ${photos.length}`;
    if (!lightbox.open) {
      lightbox.showModal();
      document.body.classList.add('dialog-open');
      close.focus({preventScroll: true});
    }
  }
  document.querySelectorAll('[data-photo]').forEach(button => {
    button.addEventListener('click', () => {
      returnFocus = button;
      showPhoto(photos.findIndex(photo => photo.id === button.dataset.photo));
    });
  });
  document.querySelector('#previous-photo').addEventListener('click', () => showPhoto(current - 1));
  document.querySelector('#next-photo').addEventListener('click', () => showPhoto(current + 1));
  close.addEventListener('click', () => lightbox.close());
  document.addEventListener('keydown', event => {
    if (!lightbox.open || !photos.length) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    returnFocus?.focus({preventScroll: true});
  });
})();
