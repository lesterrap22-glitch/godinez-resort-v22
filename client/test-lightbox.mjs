import { JSDOM } from 'jsdom';
import fs from 'fs';

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000/',
  runScripts: 'outside-only',
  resources: 'usable',
});

const nodeFetch = globalThis.fetch;

global.window = dom.window;
global.document = dom.window.document;

// Only copy the specific DOM globals React/the app actually needs - copying
// everything (e.g. `performance`) collides with Node's own built-ins and
// causes infinite recursion between the two implementations.
const NEEDED = [
  'HTMLElement', 'Element', 'Node', 'Document', 'DocumentFragment', 'Text', 'Comment',
  'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'PointerEvent', 'WheelEvent', 'TouchEvent',
  'MutationObserver', 'NodeList', 'DOMParser', 'FormData', 'File', 'Blob', 'Image',
  'getComputedStyle', 'SVGElement',
];
for (const key of NEEDED) {
  if (dom.window[key] !== undefined) global[key] = dom.window[key];
}

Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.fetch = (url, opts) => {
  const full = String(url).startsWith('http') ? url : `http://localhost:3000${url}`;
  return nodeFetch(full, opts);
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const distDir = new URL('./dist/assets/', import.meta.url);
const files = fs.readdirSync('./dist/assets');
const mainFile = files.find((f) => f.startsWith('main-'));
await import(new URL(mainFile, distDir).href);

// Let effects (data fetching) settle.
await new Promise((r) => setTimeout(r, 1500));

function count(sel) { return document.querySelectorAll(sel).length; }

console.log('root children:', document.getElementById('root').children.length);
console.log('villas cards found:', count('.card'));

const heroImg = document.querySelector('.hero-bg');
if (!heroImg) throw new Error('hero image not found');
heroImg.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
await new Promise((r) => setTimeout(r, 100));
console.log('lightbox open after hero click:', count('.lightbox-overlay') === 1);

const closeBtn = document.querySelector('.lightbox-close');
if (!closeBtn) throw new Error('close button not found');
closeBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
await new Promise((r) => setTimeout(r, 100));
console.log('lightbox closed after close click:', count('.lightbox-overlay') === 0);

const bookBtn = document.querySelector('.nav-cta');
bookBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
await new Promise((r) => setTimeout(r, 100));
console.log('booking modal open:', count('.modal-overlay') === 1);

const modalCloseBtn = document.querySelector('.modal-close');
modalCloseBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
await new Promise((r) => setTimeout(r, 100));
console.log('booking modal closed:', count('.modal-overlay') === 0);

console.log('ALL CHECKS DONE');
process.exit(0);
