// sw.js
const CACHE_NAME = 'claramente-v1'; // Nome do cache
const ASSETS_TO_CACHE = [ // Itens que serão salvos offline
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/assets/icon.png' // (opcional: se tiver uma imagem de logo)
];

// Instalação - Guarda os arquivos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Intercepta as requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request) // Tenta achar no cache
      .then(response => response || fetch(event.request)) // Se não achar, busca online
  );
});
