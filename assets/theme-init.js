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
})();
