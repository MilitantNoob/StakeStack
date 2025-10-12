const CACHE_NAME_BASE = 'stakestack-pwa-v';
let CACHE_NAME = CACHE_NAME_BASE + '1'; // Default version
let currentVersion = 1;

// Function to get the current version from the server
async function getCurrentVersion() {
  try {
    const response = await fetch('/version.json');
    const versionData = await response.json();
    return versionData.version;
  } catch (error) {
    console.error('Failed to fetch version.json:', error);
    return currentVersion; // Return current version as fallback
  }
}

// Function to update the cache name based on version
function updateCacheName(version) {
  return CACHE_NAME_BASE + version;
}

self.addEventListener('install', async function(event) {
  // Wait for the version to be fetched before proceeding
  event.waitUntil(
    getCurrentVersion()
      .then(function(version) {
        currentVersion = version;
        CACHE_NAME = updateCacheName(version);
        return caches.open(CACHE_NAME)
          .then(function(cache) {
            console.log('Opened cache with version:', version);
            return cache.addAll([
              '/',
              '/index.html',
              '/manifest.json',
              '/version.json',  // Add version.json to cache
              '/sw.js',
              '/TemplateData/style.css',
              '/TemplateData/favicon.ico',
              '/TemplateData/Logo.png',
              '/Build/Build.framework.js',
              '/Build/Build.loader.js',
              '/Build/Build.wasm',
              '/Build/Build.data',
              '/StreamingAssets/UnityServicesProjectConfiguration.json'
            ]);
          });
      })
      .catch(function(error) {
        console.error('Error during install:', error);
        // Still open the default cache if version fetch fails
        return caches.open(CACHE_NAME)
          .then(function(cache) {
            console.log('Opened fallback cache');
            return cache.addAll([
              '/',
              '/index.html',
              '/manifest.json',
              '/version.json',
              '/sw.js',
              '/TemplateData/style.css',
              '/TemplateData/favicon.ico',
              '/TemplateData/Logo.png',
              '/Build/Build.framework.js',
              '/Build/Build.loader.js',
              '/Build/Build.wasm',
              '/Build/Build.data',
              '/StreamingAssets/UnityServicesProjectConfiguration.json'
            ]);
          });
      })
  );
});

self.addEventListener('fetch', function(event) {
  // Skip handling fetch requests for popup windows
  if (event.request.destination === 'window' || event.request.destination === 'iframe') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return the cached response if found
        if (response) {
          return response;
        }

        // Clone the request because it can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      }
    )
  );
});

self.addEventListener('activate', async function(event) {
  event.waitUntil(
    Promise.all([
      // Get the current version from the server
      getCurrentVersion()
        .then(function(version) {
          currentVersion = version;
          const newCacheName = updateCacheName(version);
          
          // If cache version changed, delete old caches
          if (newCacheName !== CACHE_NAME) {
            console.log(`Version changed from ${CACHE_NAME} to ${newCacheName}. Clearing old caches.`);
            CACHE_NAME = newCacheName; // Update the current cache name
            
            return caches.keys().then(function(cacheNames) {
              return Promise.all(
                cacheNames.map(function(cacheName) {
                  // Delete all caches that start with our base name but are not the current version
                  if (cacheName.startsWith(CACHE_NAME_BASE) && cacheName !== CACHE_NAME) {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                  }
                })
              );
            });
          }
        })
        .catch(function(error) {
          console.error('Error during activation:', error);
        }),
      
      // Clients.claim() to immediately take control of all pages
      self.clients.claim()
    ])
  );
});