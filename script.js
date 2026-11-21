'use strict';
const projects = window.PORTFOLIO_PROJECTS || [];
const videoProjects = window.PORTFOLIO_VIDEOS || [];
const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('#design .project-card')];
const count = document.querySelector('#project-count');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('is-active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
  const total = cards.filter(card => !card.hidden).length;
  count.textContent = `${total} project${total === 1 ? '' : 's'}`;
}));
const dialog = document.querySelector('#project-dialog');
const gallery = document.querySelector('#project-gallery');
const closeButton = document.querySelector('#close-dialog');
const nextProjectButton = document.querySelector('#next-project');
const intro = document.querySelector('#dialog-intro');
const credit = document.querySelector('#dialog-credit');
let currentProject = projects[0];
let currentCollection = 'design';
let returnFocus = null;
function stopVideos() { gallery.querySelectorAll('video').forEach(video => video.pause()); }
function visibleProjects() {
  if (currentCollection === 'video') return videoProjects;
  const visibleIds = new Set(cards.filter(card => !card.hidden).map(card => card.querySelector('[data-project]').dataset.project));
  return projects.filter(project => visibleIds.has(project.id));
}
function showProject(id, collection = currentCollection) {
  const collectionProjects = collection === 'video' ? videoProjects : projects;
  const project = collectionProjects.find(item => item.id === id);
  if (!project) return;
  currentProject = project;
  currentCollection = collection;
  const isVideo = collection === 'video';
  stopVideos();
  dialog.classList.toggle('video-project-dialog', isVideo);
  document.querySelector('#dialog-title').textContent = project.title;
  document.querySelector('#dialog-category').textContent = [project.organization, project.discipline, project.year || project.duration].filter(Boolean).join(' / ');
  intro.textContent = project.intro || '';
  intro.hidden = !project.intro;
  document.querySelector('#dialog-overview-heading').textContent = project.overviewHeading || (isVideo ? 'The film' : 'The project');
  document.querySelector('#dialog-deliverables-heading').textContent = isVideo ? 'Project details' : 'Selected deliverables';
  document.querySelector('#dialog-overview').textContent = project.overview;
  document.querySelector('#dialog-deliverables').textContent = project.deliverables;
  credit.textContent = project.credit;
  if (isVideo) intro.after(gallery);
  else credit.after(gallery);
  gallery.replaceChildren();
  project.gallery.forEach(art => {
    const figure = document.createElement('figure');
    const frame = document.createElement('div');
    frame.className = `gallery-image surface-${project.surface}`;
    let media;
    if (art.type === 'video') {
      media = document.createElement('video');
      media.controls = true;
      media.playsInline = true;
      media.preload = isVideo ? 'metadata' : 'none';
      media.poster = art.poster || '';
      if (art.width) media.width = art.width;
      if (art.height) media.height = art.height;
      media.setAttribute('aria-label', art.alt);
      const source = document.createElement('source');
      source.src = art.src;
      source.type = 'video/mp4';
      media.append(source, document.createTextNode('Your browser cannot play this video.'));
    } else {
      media = document.createElement('img');
      media.src = art.src;
      media.alt = art.alt;
      media.width = art.width;
      media.height = art.height;
      media.loading = 'lazy';
      media.decoding = 'async';
    }
    frame.append(media);
    const caption = document.createElement('figcaption');
    caption.textContent = art.caption;
    figure.append(frame, caption);
    gallery.append(figure);
  });
  const filtered = visibleProjects();
  const sequence = filtered.length ? filtered : collectionProjects;
  const next = sequence[(sequence.indexOf(project) + 1) % sequence.length];
  nextProjectButton.hidden = sequence.length < 2;
  nextProjectButton.textContent = `Next project: ${next.title}`;
  if (!dialog.open) { dialog.showModal(); document.body.classList.add('dialog-open'); }
  dialog.scrollTop = 0;
  closeButton.focus({preventScroll: true});
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  returnFocus = button;
  showProject(button.dataset.project, 'design');
}));
document.querySelectorAll('[data-film]').forEach(button => button.addEventListener('click', () => {
  returnFocus = button;
  showProject(button.dataset.film, 'video');
}));
document.querySelectorAll('[data-project], [data-film]').forEach(button => {
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'project-dialog');
});
closeButton.addEventListener('click', () => dialog.close());
nextProjectButton.addEventListener('click', () => {
  const sequence = visibleProjects();
  if (sequence.length) showProject(sequence[(sequence.indexOf(currentProject) + 1) % sequence.length].id);
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  stopVideos();
  document.body.classList.remove('dialog-open');
  returnFocus?.focus({preventScroll: true});
});
window.addEventListener('hashchange', () => {
  if (dialog.open) dialog.close();
});
document.querySelector('#year').textContent = new Date().getFullYear();
