const CACHE_NAME = 'asphalt-calc-v1';
const ASSETS = [
    './',
    './index.html',
    './assets/style.css',
    './assets/themes.css',
    './assets/theme-adapter.css',
    './assets/app.js',
    './assets/lang.js',
    './assets/i18n.js',
    './assets/theme-init.js',
    './assets/garage.js',
    './assets/cars.json',
    './assets/upgrades.json',
    './assets/official_car_specs.json',
    './assets/favicon.png',
    './simulators/add_batch.html',
    './simulators/analytics.html',
    './simulators/car-compare.html',
    './simulators/car-detail.html',
    './simulators/car-hunt.html',
    './simulators/car-search.html',
    './simulators/car-upgrade.html',
    './simulators/chart-logic.js',
    './simulators/daily-credit.html',
    './simulators/fullstar.html',
    './simulators/garage_detail.html',
    './simulators/garage_import.html',
    './simulators/garage_stat.html',
    './simulators/luck-rate.html',
    './simulators/my_garage.html',
    './simulators/useful-sites.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    // Stale-While-Revalidate strategy
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            });
            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
