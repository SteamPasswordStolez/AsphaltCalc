(function () {
    const KEY_LANG = "simhub_lang";
    const DEFAULT_LANG = "ko";

    window.I18N = {
        lang: DEFAULT_LANG,
        _listeners: [],

        on: function (event, callback) {
            if (event === 'change') this._listeners.push(callback);
        },

        _notify: function () {
            this._listeners.forEach(cb => cb(this.lang));
        },

        init: function () {
            // 1. Detect or Load
            const saved = localStorage.getItem(KEY_LANG);
            if (saved && TRANSLATIONS[saved]) {
                this.lang = saved;
            } else {
                // Simple auto-detect attempt (optional, trusting default 'ko' for now as main user base)
                const browser = navigator.language.slice(0, 2);
                if (TRANSLATIONS[browser]) {
                    this.lang = browser;
                }
            }

            // 2. Apply initial
            document.documentElement.lang = this.lang;
            this.apply();
            this._notify();
        },

        setLang: function (lang) {
            if (!TRANSLATIONS[lang]) {
                console.warn("Unknown lang:", lang);
                return;
            }
            this.lang = lang;
            localStorage.setItem(KEY_LANG, lang);
            document.documentElement.lang = lang;

            // Dynamic Update
            this.apply();
            this._notify();
        },

        t: function (key) {
            const map = TRANSLATIONS[this.lang] || TRANSLATIONS[DEFAULT_LANG];
            return map[key] || TRANSLATIONS[DEFAULT_LANG][key] || key;
        },

        apply: function () {
            // 1. Update Text Content ([data-i18n])
            document.querySelectorAll("[data-i18n]").forEach(el => {
                const key = el.dataset.i18n;
                const txt = this.t(key);
                // Safety: If translation contains HTML Tags (like <b>), we should use innerHTML. 
                // Our lang.js has 'se.source' with <b>.
                if (txt.includes("<")) {
                    el.innerHTML = txt;
                } else {
                    el.textContent = txt;
                }
            });

            // 2. Update Placeholders ([data-i18n-ph])
            document.querySelectorAll("[data-i18n-ph]").forEach(el => {
                const key = el.dataset.i18nPh;
                el.placeholder = this.t(key);
            });

            // 3. Update Titles ([data-i18n-title])
            document.querySelectorAll("[data-i18n-title]").forEach(el => {
                const key = el.dataset.i18nTitle;
                el.title = this.t(key);
            });

            // 4. Update Select (if it exists)
            const sel = document.getElementById("langSel");
            if (sel && sel.value !== this.lang) {
                sel.value = this.lang;
            }
        }
    };

    // Auto Init
    window.addEventListener("DOMContentLoaded", () => {
        // Check if TRANSLATIONS is loaded
        if (typeof TRANSLATIONS !== "undefined") {
            I18N.init();
        } else {
            console.error("TRANSLATIONS not found. Make sure lang.js is loaded before i18n.js");
        }
    });

})();
