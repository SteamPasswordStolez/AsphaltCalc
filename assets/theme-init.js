// theme-init.js - Common theme initialization for all simulators
(function () {
    var GKEY = "simhub_theme_global";
    var OKEY = "simhub_theme_overrides";

    // Helper to resolve 'system' theme
    function resolveSystem(theme) {
        if (theme !== "system") return theme;
        var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return isDark ? "dark" : "light";
    }

    function apply() {
        // 1. Get Global Theme
        var g = localStorage.getItem(GKEY) || "asphalt";

        // 2. Get Overrides Map
        var map;
        try {
            map = JSON.parse(localStorage.getItem(OKEY) || "{}");
        } catch (_) {
            map = {};
        }

        // 3. Determine Final Theme
        // SIM_ID should be defined in the HTML before loading this script
        // If not defined, fallback to global only.
        var simId = window.SIM_ID || null;
        var t = (simId && map[simId]) ? map[simId] : g;

        // 4. Apply to document
        document.documentElement.dataset.theme = resolveSystem(t);
    }

    try { apply(); } catch (e) { console.warn("Theme Init Error:", e); }
    // Expose Global Utils
    window.getQueryParam = function (name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    };

    // PWA: Inject Manifest & Register Service Worker
    var path = window.location.pathname;
    // Simple heuristic: if 'simulators' or 'board' in path, go up one level
    var isSub = path.indexOf('/simulators/') !== -1 || path.indexOf('/board/') !== -1;
    var relPath = isSub ? '../' : './';

    // 1. Inject Manifest
    var link = document.createElement('link');
    link.rel = 'manifest';
    link.href = relPath + 'manifest.json';
    document.head.appendChild(link);

    // 2. Register SW
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register(relPath + 'sw.js').then(function (reg) {
                console.log('SW registered: ', reg.scope);
            }, function (err) {
                console.log('SW registry failed: ', err);
            });
        });
    }
})();
