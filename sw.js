/*
  Service worker: guarda la app en la tablet para que se abra sin conexión.
  Si cambias cualquier archivo de la app, sube el número de VERSION
  para que las tablets descarguen la versión nueva.
*/
const VERSION = 'partes-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  './fonts/barlow-latin-400-normal.woff2',
  './fonts/barlow-latin-500-normal.woff2',
  './fonts/barlow-latin-600-normal.woff2',
  './fonts/barlow-condensed-latin-600-normal.woff2',
  './fonts/barlow-condensed-latin-700-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, {cache: 'reload'})))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('partes-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'actualizar') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // el servidor de Google no pasa por aquí

  // config.js: primero la red (para recoger cambios), si no hay conexión, la copia guardada
  if (url.pathname.endsWith('/config.js')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put('./config.js', copia)); }
        return res;
      }).catch(() => caches.match('./config.js'))
    );
    return;
  }

  // Al abrir la app: siempre la copia guardada, así arranca igual con o sin cobertura
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
    return;
  }

  e.respondWith(caches.match(req, {ignoreSearch: true}).then(r => r || fetch(req)));
});
