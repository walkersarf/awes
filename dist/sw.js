const CACHE_NAME = 'aw-pms-cache-v1';
// In a real production app, you might want to cache specific assets.
// For now, this is a basic shell Service Worker required for the PWA install prompt.

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); // Claim all clients immediately.
});

self.addEventListener('fetch', (event) => {
    // A basic fetch handler is required by Chrome to show the installation prompt.
    // We can pass the request directly to the network for now.
    event.respondWith(
        fetch(event.request).catch(() => {
            // Return a basic offline fallback if network fails
            return new Response('You are offline. Please connect to the internet.');
        })
    );
});
