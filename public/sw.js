const CACHE_NAME = 'reversi-runtime-v1'
const CORE_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/pwa-192.svg', '/pwa-512.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(CORE_ASSETS)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME)
            cache.put('/', networkResponse.clone())
          }
          return networkResponse
        } catch {
          const cache = await caches.open(CACHE_NAME)
          return (await cache.match('/')) || (await cache.match('/index.html'))
        }
      })(),
    )
    return
  }

  if (url.origin !== self.location.origin) return

  // Vite emits content-hashed files under /assets/, so they are safe to serve
  // cache-first. Everything else (manifest, icons) is network-first so stale
  // copies are never served while online.
  const isHashedAsset = url.pathname.startsWith('/assets/')

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)

      if (isHashedAsset) {
        const cached = await cache.match(request)
        if (cached) return cached
      }

      try {
        const response = await fetch(request)
        if (response.ok) {
          cache.put(request, response.clone())
        }
        return response
      } catch (error) {
        const cached = await cache.match(request)
        if (cached) return cached
        throw error
      }
    })(),
  )
})
