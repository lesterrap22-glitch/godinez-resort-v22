// Front-end for the Godinez Resort site.
// Fetches catalog data (villas, pools, activities, tours, restaurant) from
// the /api/* endpoints and renders it, and wires up the booking modal that
// posts reservation requests to /api/bookings.

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`);
  return res.json();
}

// NOTE: the third argument is rendered as plain text (textContent), never
// parsed as HTML. Content here (villa names/descriptions, etc.) is editable
// through the admin dashboard, so treating it as HTML would let an admin
// account - even a phished/compromised one - inject a script that runs in
// every visitor's browser (stored XSS). If you ever need real markup, build
// it with separate elements/appendChild instead of string concatenation.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Builds an icon-illustration tile (gradient + emoji) as a stand-in for a real
// photo. `tileClass` picks the color scheme (tile-villa, tile-pool,
// tile-restaurant, tile-activity - see public/css/style.css). Once you have
// real photos, replace calls to this with a plain <img src="images/...">.
function iconTile(tileClass, icon, label) {
  const wrap = el('div', `icon-tile ${tileClass}`);
  const glyph = el('span', 'icon-tile-glyph', icon || '\u{1F3E1}');
  glyph.setAttribute('role', 'img');
  glyph.setAttribute('aria-label', label || '');
  wrap.appendChild(glyph);
  return wrap;
}

// Builds a real photo block (used for Travel & Tours spots, and any other
// item with a photoUrl - see cardMedia() below) with an optional small
// credit caption in the corner (only needed for the CC BY-SA tour photos).
// galleryName + galleryIndex tag the <img> so a click can open the lightbox
// on the right photo, in the right section, with working prev/next.
function photoTile(photoUrl, alt, credit, fallbackTileClass, fallbackIcon, galleryName, galleryIndex) {
  const wrap = el('div', `tour-photo-wrap ${fallbackTileClass || ''}`);
  // object-fit: cover (set in CSS) fills 100% of the tile, cropping evenly
  // as needed - no letterboxing, no backdrop layer required.
  const img = el('img', 'tour-photo');
  img.src = photoUrl;
  img.alt = alt;
  img.loading = 'lazy';
  if (galleryName !== undefined) img.dataset.gallery = galleryName;
  if (galleryIndex !== undefined) img.dataset.galleryIndex = String(galleryIndex);
  img.onerror = () => {
    // If the image fails to load (bad path, external host down, etc.), fall
    // back to an icon tile so the page still looks intentional instead of
    // showing a broken-image icon.
    wrap.replaceWith(iconTile(fallbackTileClass || 'tile-activity', fallbackIcon, alt));
  };
  wrap.appendChild(img);
  if (credit) {
    const creditEl = el('span', 'photo-credit', credit);
    wrap.appendChild(creditEl);
  }
  return wrap;
}

// Picks a real photo if the item has one (item.photoUrl), otherwise falls
// back to the icon-illustration tile. This is what makes swapping in real
// photos easy: just add a "photoUrl" (and optionally "photoCredit") field to
// any item in server/data/content/*.json and it'll show up here automatically -
// no code changes needed. Local photos go in server/data/images/ and are
// referenced like "images/your-photo.jpg".
function cardMedia(item, tileClass, galleryName, galleryIndex) {
  if (item.photoUrl) {
    return photoTile(item.photoUrl, item.name, item.photoCredit, tileClass, item.icon, galleryName, galleryIndex);
  }
  return iconTile(tileClass, item.icon, item.name);
}

function bookButton(type, itemId, itemName, label = 'Book Now') {
  const btn = el('button', 'btn btn-primary', label);
  btn.dataset.openBooking = 'true';
  btn.dataset.type = type;
  btn.dataset.itemId = itemId;
  btn.dataset.itemName = itemName;
  return btn;
}

function renderVillas(villas) {
  const grid = document.getElementById('villas-grid');
  grid.innerHTML = '';
  villas.forEach((v, i) => {
    const card = el('div', 'card');
    card.appendChild(cardMedia(v, 'tile-villa', 'villas', i));
    const body = el('div', 'card-body');
    body.appendChild(el('h3', null, v.name));
    body.appendChild(el('p', 'meta', `Sleeps up to ${v.capacity} guests · ${v.bedrooms} bedroom(s)`));
    body.appendChild(el('p', null, v.description));
    const list = el('ul', 'amenities');
    v.amenities.forEach((a) => list.appendChild(el('li', null, a)));
    body.appendChild(list);
    body.appendChild(el('p', 'meta', v.priceNote));
    body.appendChild(bookButton('villa', v.id, v.name, 'Book This Villa'));
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function renderPools(pools) {
  const grid = document.getElementById('pools-grid');
  grid.innerHTML = '';
  pools.forEach((p, i) => {
    const card = el('div', 'card');
    card.appendChild(cardMedia(p, 'tile-pool', 'pools', i));
    const body = el('div', 'card-body');
    body.appendChild(el('h3', null, p.name));
    body.appendChild(el('p', 'meta', `Depth: ${p.depth}`));
    body.appendChild(el('p', null, p.description));
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function renderRestaurant(r) {
  const wrap = document.getElementById('restaurant-content');
  wrap.innerHTML = '';
  // Add to the existing classes (this element starts as class="container" in
  // index.html) instead of replacing className outright - overwriting it was
  // silently dropping the "container" class, which is what gives every other
  // section its max-width and side padding. That's why this section kept
  // looking edge-to-edge no matter what the CSS said.
  wrap.classList.add('restaurant-wrap');

  wrap.appendChild(cardMedia(r, 'tile-restaurant', 'restaurant', 0));

  const text = el('div');
  text.appendChild(el('h2', null, r.name));
  text.appendChild(el('p', 'section-intro', r.tagline));
  text.appendChild(el('p', 'meta', `Hours: ${r.hours}`));
  const list = el('ul', 'restaurant-highlights');
  r.highlights.forEach((h) => {
    const li = el('li');
    // Built from separate elements (not string-concatenated innerHTML) so
    // admin-entered text can never be interpreted as markup/script.
    const strong = el('strong', null, h.name);
    li.appendChild(strong);
    li.appendChild(document.createTextNode(h.description));
    list.appendChild(li);
  });
  text.appendChild(list);
  text.appendChild(el('p', 'meta', r.notes));
  text.appendChild(bookButton('restaurant', 'general', r.name, 'Reserve a Table'));
  wrap.appendChild(text);
}

function renderActivities(activities) {
  const grid = document.getElementById('activities-grid');
  grid.innerHTML = '';
  activities.forEach((a, i) => {
    const card = el('div', 'card');
    card.appendChild(cardMedia(a, 'tile-activity', 'activities', i));
    const body = el('div', 'card-body');
    body.appendChild(el('span', 'badge', `Effort: ${a.effort}`));
    body.appendChild(el('h3', null, a.name));
    body.appendChild(el('p', null, a.description));
    body.appendChild(el('p', 'why', a.whyItWorks));
    body.appendChild(bookButton('activity', a.id, a.name, 'Reserve This Activity'));
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function renderTours(tours) {
  const grid = document.getElementById('tours-grid');
  grid.innerHTML = '';
  tours.forEach((t, i) => {
    const card = el('div', 'card');
    card.appendChild(cardMedia(t, 'tile-activity', 'tours', i));
    const body = el('div', 'card-body');
    body.appendChild(el('span', 'badge', t.city));
    body.appendChild(el('h3', null, t.name));
    body.appendChild(el('p', null, t.description));
    body.appendChild(bookButton('tour', t.id, t.name, 'Book This Tour'));
    card.appendChild(body);
    grid.appendChild(card);
  });
}

// Applies whichever color theme the admin has picked (see admin-dashboard's
// "Color Theme" tab) by overriding the CSS custom properties set in
// public/css/style.css's :root. Falls back to the built-in default colors
// (already in the stylesheet) if this fails for any reason.
async function applyTheme() {
  try {
    const { vars } = await fetchJSON('/api/theme');
    Object.entries(vars || {}).forEach(([name, value]) => {
      document.documentElement.style.setProperty(name, value);
    });
  } catch (err) {
    console.error(err);
  }
}

// Photo galleries, keyed by section name, populated once content loads.
// Each entry is an ordered list of { url, alt, credit } matching the photos
// rendered in that section - this is what powers the lightbox's prev/next.
const galleries = {};

// The hero photo is static markup (not built from server/data/content/*.json
// like the other sections), so it gets its own one-photo gallery here instead
// of via buildGallery(). It points at the full uncropped aerial photo (rather
// than the desktop/mobile hero crops actually shown as the background) so
// clicking it to zoom in shows the whole shot, not just whichever slice is
// visible behind the "Godinez Resort" heading.
galleries.hero = [{ url: 'images/hero-full.jpg', alt: 'Aerial view of Godinez Resort', credit: '' }];

function buildGallery(items) {
  return items
    .filter((item) => item.photoUrl)
    .map((item) => ({ url: item.photoUrl, alt: item.name, credit: item.photoCredit || '' }));
}

async function loadAllContent() {
  try {
    const [villas, pools, activities, tours, restaurant] = await Promise.all([
      fetchJSON('/api/villas'),
      fetchJSON('/api/pools'),
      fetchJSON('/api/activities'),
      fetchJSON('/api/tours'),
      fetchJSON('/api/restaurant'),
    ]);
    renderVillas(villas);
    renderPools(pools);
    renderActivities(activities);
    renderTours(tours);
    renderRestaurant(restaurant);

    galleries.villas = buildGallery(villas);
    galleries.pools = buildGallery(pools);
    galleries.activities = buildGallery(activities);
    galleries.tours = buildGallery(tours);
    galleries.restaurant = buildGallery([restaurant]);
  } catch (err) {
    console.error(err);
  }
}

// ---- Booking modal ----

const modal = document.getElementById('booking-modal');
const modalTitle = document.getElementById('modal-title');
const modalItemName = document.getElementById('modal-item-name');
const form = document.getElementById('booking-form');
const feedback = document.getElementById('booking-feedback');
let currentBooking = { type: '', itemId: '', itemName: '' };

function openModal(type, itemId, itemName) {
  currentBooking = { type, itemId, itemName };
  const typeLabels = { villa: 'Book a Villa', tour: 'Book a Tour', activity: 'Reserve an Activity', restaurant: 'Restaurant Reservation' };
  modalTitle.textContent = typeLabels[type] || 'Book Now';
  modalItemName.textContent = itemName;
  feedback.textContent = '';
  feedback.className = 'booking-feedback';
  form.reset();
  form.querySelector('[name="guests"]').value = 2;
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
}

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-open-booking]');
  if (trigger) {
    openModal(trigger.dataset.type, trigger.dataset.itemId, trigger.dataset.itemName);
  }
});

document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const payload = {
    type: currentBooking.type,
    itemId: currentBooking.itemId,
    itemName: currentBooking.itemName,
    name: data.get('name'),
    email: data.get('email'),
    phone: data.get('phone'),
    date: data.get('date'),
    guests: Number(data.get('guests')),
    notes: data.get('notes') || '',
  };

  const submitBtn = document.getElementById('booking-submit');
  submitBtn.disabled = true;
  feedback.textContent = 'Submitting...';
  feedback.className = 'booking-feedback';

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (res.ok && result.ok) {
      feedback.textContent = 'Request sent! We will contact you to confirm.';
      feedback.className = 'booking-feedback success';
      form.reset();
      setTimeout(closeModal, 1800);
    } else {
      feedback.textContent = (result.errors && result.errors[0]) || 'Something went wrong. Please try again.';
      feedback.className = 'booking-feedback error';
    }
  } catch (err) {
    feedback.textContent = 'Network error. Please try again.';
    feedback.className = 'booking-feedback error';
  } finally {
    submitBtn.disabled = false;
  }
});

// ---- Photo lightbox: click any real photo to view it larger, with zoom/pan ----

const lightbox = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxStage = document.getElementById('lightbox-stage');
const lightboxCaption = document.getElementById('lightbox-caption');

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.4;
let zoomScale = 1;
let panX = 0;
let panY = 0;

function applyZoomTransform() {
  lightboxImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  lightboxStage.style.cursor = zoomScale > 1 ? 'grab' : 'zoom-in';
}

function setZoom(newScale) {
  zoomScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale));
  if (zoomScale === ZOOM_MIN) {
    panX = 0;
    panY = 0;
  }
  applyZoomTransform();
}

// Which gallery/photo is currently open, so prev/next know where to go.
let currentGalleryName = null;
let currentGalleryIndex = 0;
const lightboxPrevBtn = document.getElementById('lightbox-prev');
const lightboxNextBtn = document.getElementById('lightbox-next');
const lightboxCounter = document.getElementById('lightbox-counter');

function renderLightboxPhoto() {
  const list = galleries[currentGalleryName] || [];
  const photo = list[currentGalleryIndex];
  if (!photo) return;
  lightboxImg.src = photo.url;
  lightboxImg.alt = photo.alt || '';
  lightboxCaption.textContent = [photo.alt, photo.credit].filter(Boolean).join(' — ');
  zoomScale = 1;
  panX = 0;
  panY = 0;
  applyZoomTransform();

  const hasMultiple = list.length > 1;
  lightboxPrevBtn.hidden = !hasMultiple;
  lightboxNextBtn.hidden = !hasMultiple;
  lightboxCounter.hidden = !hasMultiple;
  if (hasMultiple) {
    lightboxCounter.textContent = `${currentGalleryIndex + 1} / ${list.length}`;
  }
}

function openLightbox(galleryName, index) {
  currentGalleryName = galleryName;
  currentGalleryIndex = index;
  renderLightboxPhoto();
  lightbox.hidden = false;
}

function showPrevPhoto() {
  const list = galleries[currentGalleryName] || [];
  if (!list.length) return;
  currentGalleryIndex = (currentGalleryIndex - 1 + list.length) % list.length;
  renderLightboxPhoto();
}

function showNextPhoto() {
  const list = galleries[currentGalleryName] || [];
  if (!list.length) return;
  currentGalleryIndex = (currentGalleryIndex + 1) % list.length;
  renderLightboxPhoto();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.src = '';
}

// Open the lightbox whenever a real photo (not an icon-tile) is clicked.
document.addEventListener('click', (e) => {
  const img = e.target.closest('img.tour-photo');
  if (!img) return;
  const galleryName = img.dataset.gallery;
  const index = Number(img.dataset.galleryIndex || 0);
  if (galleryName && galleries[galleryName] && galleries[galleryName].length) {
    openLightbox(galleryName, index);
  }
});

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox-zoom-in').addEventListener('click', () => setZoom(zoomScale + ZOOM_STEP));
document.getElementById('lightbox-zoom-out').addEventListener('click', () => setZoom(zoomScale - ZOOM_STEP));
document.getElementById('lightbox-zoom-reset').addEventListener('click', () => setZoom(1));
lightboxPrevBtn.addEventListener('click', showPrevPhoto);
lightboxNextBtn.addEventListener('click', showNextPhoto);

// Click the dark backdrop (but not the toolbar/image/caption) to close.
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target === lightboxStage) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === '+' || e.key === '=') setZoom(zoomScale + ZOOM_STEP);
  if (e.key === '-') setZoom(zoomScale - ZOOM_STEP);
  if (e.key === 'ArrowRight') showNextPhoto();
  if (e.key === 'ArrowLeft') showPrevPhoto();
});

// Mouse-wheel / trackpad. A vertical scroll zooms in/out as before; a mostly
// horizontal scroll (two-finger swipe on a trackpad) instead moves to the
// next/previous photo, same as swiping on a touchscreen below.
lightboxStage.addEventListener(
  'wheel',
  (e) => {
    if (lightbox.hidden) return;
    e.preventDefault();
    if (zoomScale === 1 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 12) showNextPhoto();
      else if (e.deltaX < -12) showPrevPhoto();
      return;
    }
    setZoom(zoomScale - e.deltaY * 0.0025 * ZOOM_MAX);
  },
  { passive: false }
);

// Drag-to-pan with mouse/touch (pointer events cover both) once zoomed in.
// When NOT zoomed, the same drag gesture instead swipes to the next/previous
// photo - so photos can be browsed by swiping, not just via the arrow
// buttons.
let isDragging = false;
let isSwiping = false;
let dragStartX = 0;
let dragStartY = 0;
let panStartX = 0;
let panStartY = 0;
const SWIPE_THRESHOLD = 50;

lightboxStage.addEventListener('pointerdown', (e) => {
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  if (zoomScale > 1) {
    isDragging = true;
    lightboxStage.classList.add('is-dragging');
    panStartX = panX;
    panStartY = panY;
  } else {
    isSwiping = true;
  }
});
lightboxStage.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  panX = panStartX + (e.clientX - dragStartX);
  panY = panStartY + (e.clientY - dragStartY);
  applyZoomTransform();
});
['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => {
  lightboxStage.addEventListener(evt, (e) => {
    if (isDragging) {
      isDragging = false;
      lightboxStage.classList.remove('is-dragging');
    }
    if (isSwiping) {
      isSwiping = false;
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) showNextPhoto();
        else showPrevPhoto();
      }
    }
  });
});

// Two-finger pinch-to-zoom on touch devices.
let pinchStartDist = null;
let pinchStartScale = 1;
function touchDistance(touches) {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
lightboxStage.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    pinchStartDist = touchDistance(e.touches);
    pinchStartScale = zoomScale;
  }
});
lightboxStage.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length === 2 && pinchStartDist) {
      e.preventDefault();
      const ratio = touchDistance(e.touches) / pinchStartDist;
      setZoom(pinchStartScale * ratio);
    }
  },
  { passive: false }
);
lightboxStage.addEventListener('touchend', () => {
  pinchStartDist = null;
});

applyTheme();
loadAllContent();
