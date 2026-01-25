/**
 * achievements.js
 * Tracks Garage Achievements based on user inventory.
 * V2.0 - Massive Overhaul (113+ Items, Difficulty Tiers)
 */

(function (root) {
    const STORAGE_KEY = 'simhub_achievements_v2';

    // Difficulty Constants
    const DIFF = {
        1: { id: 'VL', label: 'Very Low', color: '#9ca3af' },      // 5 items
        2: { id: 'L', label: 'Low', color: '#10b981' },           // 10 items
        3: { id: 'ML', label: 'Mid-Low', color: '#34d399' },       // 8 items
        4: { id: 'M', label: 'Mid', color: '#3b82f6' },           // 15 items
        5: { id: 'MH', label: 'Mid-High', color: '#6366f1' },      // 20 items
        6: { id: 'H', label: 'High', color: '#8b5cf6' },          // 25 items
        7: { id: 'VH', label: 'Very High', color: '#ef4444' }      // 30 items
    };

    // Helper Functions
    function countTotalStars(cars) { return cars.reduce((acc, c) => acc + (c.star || 0), 0); }
    function countMaxedCars(cars, meta) {
        return cars.filter(g => {
            const r = meta.find(m => String(m.id) === String(g.id));
            return r && g.star >= r.max_star;
        }).length;
    }
    function countClass(cars, meta, cls) {
        return cars.filter(g => {
            const r = meta.find(m => String(m.id) === String(g.id));
            return r && r.class === cls;
        }).length;
    }
    function sumTotalRank(cars, meta) {
        // Use current rank if available, otherwise estimate based on star?
        // garage.js cars usually have 'rank' property if data was saved property.
        // If not, we can't calculate perfectly. Assuming 'rank' is saved in my_garage data.
        return cars.reduce((acc, c) => acc + (c.rank || 0), 0);
    }
    function checkBrand(cars, meta, brands, min) {
        let count = 0;
        cars.forEach(g => {
            const r = meta.find(m => String(m.id) === String(g.id));
            if (r && brands.some(b => r.name.toUpperCase().includes(b))) count++;
        });
        return count >= min;
    }
    function checkStatExists(cars, meta, type, val) {
        return cars.some(g => {
            const r = meta.find(m => String(m.id) === String(g.id));
            if (!r || !r.stat) return false;
            const s = r.stat.find(x => x.type === 'gold') || r.stat[r.stat.length - 1];
            return s && s[type] >= val;
        });
    }
    function countKeyCars(cars, meta) {
        return cars.filter(g => {
            const r = meta.find(m => String(m.id) === String(g.id));
            return r && r.unlock_method === 'key';
        }).length;
    }

    const BRANDS = {
        ferrari: ['FERRARI'], lambo: ['LAMBORGHINI'], porsche: ['PORSCHE'], mclaren: ['MCLAREN'],
        bugatti: ['BUGATTI'], koenig: ['KOENIGSEGG'], pagani: ['PAGANI'],
        us: ['FORD', 'CHEVROLET', 'DODGE', 'CADILLAC', 'TRION', 'SSC'],
        de: ['PORSCHE', 'BMW', 'MERCEDES', 'AUDI', 'VOLKSWAGEN'],
        gb: ['MCLAREN', 'ASTON', 'JAGUAR', 'LOTUS', 'BENTLEY'],
        it: ['FERRARI', 'LAMBORGHINI', 'PAGANI', 'MASERATI', 'ALFA'],
        fr: ['BUGATTI', 'DS', 'CITROEN', 'PEUGEOT', 'RENAULT']
    };

    // --- DEFINITIONS (Total Target: 113) ---
    const DEFINITIONS = [
        // === 1. CAR TOTAL (12 items) ===
        { id: 'col_5', cat: 'Car Total', title: 'Beginner', desc: '차량 5대', diff: 1, check: c => c.length >= 5 },
        { id: 'col_10', cat: 'Car Total', title: 'Start Line', desc: '차량 10대', diff: 1, check: c => c.length >= 10 },
        { id: 'col_25', cat: 'Car Total', title: 'Growing Garage', desc: '차량 25대', diff: 2, check: c => c.length >= 25 },
        { id: 'col_50', cat: 'Car Total', title: 'Dedicated', desc: '차량 50대', diff: 3, check: c => c.length >= 50 },
        { id: 'col_75', cat: 'Car Total', title: 'Collector', desc: '차량 75대', diff: 4, check: c => c.length >= 75 },
        { id: 'col_100', cat: 'Car Total', title: 'Centurion', desc: '차량 100대', diff: 4, check: c => c.length >= 100 },
        { id: 'col_130', cat: 'Car Total', title: 'Serious Business', desc: '차량 130대', diff: 5, check: c => c.length >= 130 },
        { id: 'col_160', cat: 'Car Total', title: 'Garage Expander', desc: '차량 160대', diff: 5, check: c => c.length >= 160 },
        { id: 'col_200', cat: 'Car Total', title: 'Double Century', desc: '차량 200대', diff: 6, check: c => c.length >= 200 },
        { id: 'col_230', cat: 'Car Total', title: 'Museum Curator', desc: '차량 230대', diff: 6, check: c => c.length >= 230 },
        { id: 'col_260', cat: 'Car Total', title: 'Asphalt Legend', desc: '차량 260대', diff: 7, check: c => c.length >= 260 },
        { id: 'col_all', cat: 'Car Total', title: 'Completionist', desc: '차량 280대 (거의 모든 차량)', diff: 7, check: c => c.length >= 280 },

        // === 2. STAR TOTAL (10 items) ===
        { id: 'st_50', cat: 'Star Total', title: 'Twinkle', desc: '별 합계 50', diff: 1, check: c => countTotalStars(c) >= 50 },
        { id: 'st_100', cat: 'Star Total', title: 'Shining', desc: '별 합계 100', diff: 2, check: c => countTotalStars(c) >= 100 },
        { id: 'st_200', cat: 'Star Total', title: 'Bright', desc: '별 합계 200', diff: 3, check: c => countTotalStars(c) >= 200 },
        { id: 'st_300', cat: 'Star Total', title: 'Radiant', desc: '별 합계 300', diff: 3, check: c => countTotalStars(c) >= 300 },
        { id: 'st_500', cat: 'Star Total', title: 'Blazing', desc: '별 합계 500', diff: 4, check: c => countTotalStars(c) >= 500 },
        { id: 'st_700', cat: 'Star Total', title: 'Nova', desc: '별 합계 700', diff: 5, check: c => countTotalStars(c) >= 700 },
        { id: 'st_900', cat: 'Star Total', title: 'Supernova', desc: '별 합계 900', diff: 5, check: c => countTotalStars(c) >= 900 },
        { id: 'st_1100', cat: 'Star Total', title: 'Black Hole', desc: '별 합계 1100', diff: 6, check: c => countTotalStars(c) >= 1100 },
        { id: 'st_1300', cat: 'Star Total', title: 'Galaxy', desc: '별 합계 1300', diff: 7, check: c => countTotalStars(c) >= 1300 },
        { id: 'st_1400', cat: 'Star Total', title: 'Universe', desc: '별 합계 1400', diff: 7, check: c => countTotalStars(c) >= 1400 },

        // === 3. STAR (MAXED CARS) (10 items) ===
        { id: 'mx_1', cat: 'Star', title: 'First Max', desc: '풀성급 1대', diff: 1, check: (c, m) => countMaxedCars(c, m) >= 1 },
        { id: 'mx_5', cat: 'Star', title: 'Handful', desc: '풀성급 5대', diff: 2, check: (c, m) => countMaxedCars(c, m) >= 5 },
        { id: 'mx_10', cat: 'Star', title: 'Squad', desc: '풀성급 10대', diff: 3, check: (c, m) => countMaxedCars(c, m) >= 10 },
        { id: 'mx_20', cat: 'Star', title: 'Fleet', desc: '풀성급 20대', diff: 4, check: (c, m) => countMaxedCars(c, m) >= 20 },
        { id: 'mx_40', cat: 'Star', title: 'Platoon', desc: '풀성급 40대', diff: 5, check: (c, m) => countMaxedCars(c, m) >= 40 },
        { id: 'mx_60', cat: 'Star', title: 'Battalion', desc: '풀성급 60대', diff: 5, check: (c, m) => countMaxedCars(c, m) >= 60 },
        { id: 'mx_80', cat: 'Star', title: 'Legion', desc: '풀성급 80대', diff: 6, check: (c, m) => countMaxedCars(c, m) >= 80 },
        { id: 'mx_100', cat: 'Star', title: 'Army', desc: '풀성급 100대', diff: 6, check: (c, m) => countMaxedCars(c, m) >= 100 },
        { id: 'mx_120', cat: 'Star', title: 'Empire', desc: '풀성급 120대', diff: 7, check: (c, m) => countMaxedCars(c, m) >= 120 },
        { id: 'mx_150', cat: 'Star', title: 'Conqueror', desc: '풀성급 150대', diff: 7, check: (c, m) => countMaxedCars(c, m) >= 150 },

        // === 4. CLASS MASTERY (15 items) ===
        { id: 'cls_d_10', cat: 'Class', title: 'D Class Pro', desc: 'D차량 10대', diff: 2, check: (c, m) => countClass(c, m, 'D') >= 10 },
        { id: 'cls_d_20', cat: 'Class', title: 'D Class Master', desc: 'D차량 20대', diff: 3, check: (c, m) => countClass(c, m, 'D') >= 20 },
        { id: 'cls_d_40', cat: 'Class', title: 'D Class King', desc: 'D차량 40대', diff: 5, check: (c, m) => countClass(c, m, 'D') >= 40 },

        { id: 'cls_c_10', cat: 'Class', title: 'C Class Pro', desc: 'C차량 10대', diff: 2, check: (c, m) => countClass(c, m, 'C') >= 10 },
        { id: 'cls_c_20', cat: 'Class', title: 'C Class Master', desc: 'C차량 20대', diff: 4, check: (c, m) => countClass(c, m, 'C') >= 20 },
        { id: 'cls_c_35', cat: 'Class', title: 'C Class King', desc: 'C차량 35대', diff: 5, check: (c, m) => countClass(c, m, 'C') >= 35 },

        { id: 'cls_b_15', cat: 'Class', title: 'B Class Pro', desc: 'B차량 15대', diff: 3, check: (c, m) => countClass(c, m, 'B') >= 15 },
        { id: 'cls_b_30', cat: 'Class', title: 'B Class Master', desc: 'B차량 30대', diff: 5, check: (c, m) => countClass(c, m, 'B') >= 30 },
        { id: 'cls_b_50', cat: 'Class', title: 'B Class King', desc: 'B차량 50대', diff: 6, check: (c, m) => countClass(c, m, 'B') >= 50 },

        { id: 'cls_a_10', cat: 'Class', title: 'A Class Pro', desc: 'A차량 10대', diff: 3, check: (c, m) => countClass(c, m, 'A') >= 10 },
        { id: 'cls_a_25', cat: 'Class', title: 'A Class Master', desc: 'A차량 25대', diff: 5, check: (c, m) => countClass(c, m, 'A') >= 25 },
        { id: 'cls_a_40', cat: 'Class', title: 'A Class King', desc: 'A차량 40대', diff: 7, check: (c, m) => countClass(c, m, 'A') >= 40 },

        { id: 'cls_s_5', cat: 'Class', title: 'S Class Elite', desc: 'S차량 5대', diff: 4, check: (c, m) => countClass(c, m, 'S') >= 5 },
        { id: 'cls_s_15', cat: 'Class', title: 'S Class Lord', desc: 'S차량 15대', diff: 6, check: (c, m) => countClass(c, m, 'S') >= 15 },
        { id: 'cls_s_30', cat: 'Class', title: 'S Class God', desc: 'S차량 30대', diff: 7, check: (c, m) => countClass(c, m, 'S') >= 30 },

        // === 5. GARAGE SCORE (TOTAL RANK) (10 items) ===
        // Scale: 100k, 200k, ... 800k?
        { id: 'gs_50k', cat: 'Garage Power', title: 'Weak Aura', desc: '전투력 합계 50,000', diff: 2, check: (c, m) => sumTotalRank(c, m) >= 50000 },
        { id: 'gs_100k', cat: 'Garage Power', title: 'Rising Power', desc: '전투력 합계 100,000', diff: 3, check: (c, m) => sumTotalRank(c, m) >= 100000 },
        { id: 'gs_200k', cat: 'Garage Power', title: 'Strong Hold', desc: '전투력 합계 200,000', diff: 4, check: (c, m) => sumTotalRank(c, m) >= 200000 },
        { id: 'gs_300k', cat: 'Garage Power', title: 'Fortress', desc: '전투력 합계 300,000', diff: 5, check: (c, m) => sumTotalRank(c, m) >= 300000 },
        { id: 'gs_400k', cat: 'Garage Power', title: 'Castle', desc: '전투력 합계 400,000', diff: 5, check: (c, m) => sumTotalRank(c, m) >= 400000 },
        { id: 'gs_500k', cat: 'Garage Power', title: 'Kingdom', desc: '전투력 합계 500,000', diff: 6, check: (c, m) => sumTotalRank(c, m) >= 500000 },
        { id: 'gs_600k', cat: 'Garage Power', title: 'Empire', desc: '전투력 합계 600,000', diff: 6, check: (c, m) => sumTotalRank(c, m) >= 600000 },
        { id: 'gs_700k', cat: 'Garage Power', title: 'Continental', desc: '전투력 합계 700,000', diff: 7, check: (c, m) => sumTotalRank(c, m) >= 700000 },
        { id: 'gs_800k', cat: 'Garage Power', title: 'Planetary', desc: '전투력 합계 800,000', diff: 7, check: (c, m) => sumTotalRank(c, m) >= 800000 },
        { id: 'gs_1m', cat: 'Garage Power', title: 'Galactic', desc: '전투력 합계 1,000,000', diff: 7, check: (c, m) => sumTotalRank(c, m) >= 1000000 },

        // === 6. CAR TYPE / BRAND (25 items) ===
        { id: 'br_fe_5', cat: 'Car Type', title: 'Ferrari Fan', desc: 'Ferrari 5대', diff: 4, check: (c, m) => checkBrand(c, m, BRANDS.ferrari, 5) },
        { id: 'br_fe_10', cat: 'Car Type', title: 'Ferrari Collector', desc: 'Ferrari 10대', diff: 6, check: (c, m) => checkBrand(c, m, BRANDS.ferrari, 10) },
        { id: 'br_la_5', cat: 'Car Type', title: 'Lambo Fan', desc: 'Lamborghini 5대', diff: 4, check: (c, m) => checkBrand(c, m, BRANDS.lambo, 5) },
        { id: 'br_la_10', cat: 'Car Type', title: 'Lambo Collector', desc: 'Lamborghini 10대', diff: 6, check: (c, m) => checkBrand(c, m, BRANDS.lambo, 10) },
        { id: 'br_po_5', cat: 'Car Type', title: 'Porsche Fan', desc: 'Porsche 5대', diff: 4, check: (c, m) => checkBrand(c, m, BRANDS.porsche, 5) },
        { id: 'br_po_10', cat: 'Car Type', title: 'Porsche Collector', desc: 'Porsche 10대', diff: 6, check: (c, m) => checkBrand(c, m, BRANDS.porsche, 10) },
        { id: 'br_mc_5', cat: 'Car Type', title: 'McLaren Fan', desc: 'McLaren 5대', diff: 4, check: (c, m) => checkBrand(c, m, BRANDS.mclaren, 5) },
        { id: 'br_mc_10', cat: 'Car Type', title: 'McLaren Collector', desc: 'McLaren 10대', diff: 7, check: (c, m) => checkBrand(c, m, BRANDS.mclaren, 10) },

        { id: 'br_bu_3', cat: 'Car Type', title: 'Bugatti Club', desc: 'Bugatti 3대', diff: 6, check: (c, m) => checkBrand(c, m, BRANDS.bugatti, 3) },
        { id: 'br_pa_3', cat: 'Car Type', title: 'Pagani Club', desc: 'Pagani 3대', diff: 6, check: (c, m) => checkBrand(c, m, BRANDS.pagani, 3) },
        { id: 'br_ko_3', cat: 'Car Type', title: 'Koenigsegg Club', desc: 'Koenigsegg 3대', diff: 6, check: (c, m) => checkBrand(c, m, BRANDS.koenig, 3) },

        { id: 'br_us_20', cat: 'Car Type', title: 'US Collection', desc: '미국차 20대', diff: 5, check: (c, m) => checkBrand(c, m, BRANDS.us, 20) },
        { id: 'br_de_20', cat: 'Car Type', title: 'German Collection', desc: '독일차 20대', diff: 5, check: (c, m) => checkBrand(c, m, BRANDS.de, 20) },
        { id: 'br_gb_20', cat: 'Car Type', title: 'British Collection', desc: '영국차 20대', diff: 5, check: (c, m) => checkBrand(c, m, BRANDS.gb, 20) },
        { id: 'br_it_20', cat: 'Car Type', title: 'Italian Collection', desc: '이탈리아차 20대', diff: 5, check: (c, m) => checkBrand(c, m, BRANDS.it, 20) },
        { id: 'br_fr_10', cat: 'Car Type', title: 'French Collection', desc: '프랑스차 10대', diff: 4, check: (c, m) => checkBrand(c, m, BRANDS.fr, 10) },

        // === 7. STATS (20 items) ===
        // Speed
        { id: 'sp_300', cat: 'Stats', title: '300 Club', desc: '300km/h+', diff: 2, check: (c, m) => checkStatExists(c, m, 'top_speed', 300) },
        { id: 'sp_350', cat: 'Stats', title: '350 Club', desc: '350km/h+', diff: 3, check: (c, m) => checkStatExists(c, m, 'top_speed', 350) },
        { id: 'sp_400', cat: 'Stats', title: '400 Club', desc: '400km/h+', diff: 5, check: (c, m) => checkStatExists(c, m, 'top_speed', 400) },
        { id: 'sp_450', cat: 'Stats', title: 'Hypersonic', desc: '450km/h+', diff: 6, check: (c, m) => checkStatExists(c, m, 'top_speed', 450) },
        { id: 'sp_500', cat: 'Stats', title: 'Light Speed', desc: '500km/h+', diff: 7, check: (c, m) => checkStatExists(c, m, 'top_speed', 500) },
        // Accel
        { id: 'ac_75', cat: 'Stats', title: 'Quick', desc: '가속 75+', diff: 2, check: (c, m) => checkStatExists(c, m, 'accel', 75) },
        { id: 'ac_82', cat: 'Stats', title: 'Fast', desc: '가속 82+', diff: 4, check: (c, m) => checkStatExists(c, m, 'accel', 82) },
        { id: 'ac_86', cat: 'Stats', title: 'Rapid', desc: '가속 86+', diff: 6, check: (c, m) => checkStatExists(c, m, 'accel', 86) },
        { id: 'ac_89', cat: 'Stats', title: 'Teleport', desc: '가속 89+', diff: 7, check: (c, m) => checkStatExists(c, m, 'accel', 89) },
        // Handling
        { id: 'hn_70', cat: 'Stats', title: 'Drifter', desc: '핸들링 70+', diff: 2, check: (c, m) => checkStatExists(c, m, 'handling', 70) },
        { id: 'hn_85', cat: 'Stats', title: 'Grip', desc: '핸들링 85+', diff: 4, check: (c, m) => checkStatExists(c, m, 'handling', 85) },
        { id: 'hn_95', cat: 'Stats', title: 'Railgun', desc: '핸들링 95+', diff: 6, check: (c, m) => checkStatExists(c, m, 'handling', 95) },
        { id: 'hn_100', cat: 'Stats', title: 'Physics Defier', desc: '핸들링 100+', diff: 7, check: (c, m) => checkStatExists(c, m, 'handling', 100) },
        // Nitro
        { id: 'ni_70', cat: 'Stats', title: 'Booster', desc: '니트로 70+', diff: 2, check: (c, m) => checkStatExists(c, m, 'nitro', 70) },
        { id: 'ni_80', cat: 'Stats', title: 'Burner', desc: '니트로 80+', diff: 4, check: (c, m) => checkStatExists(c, m, 'nitro', 80) },
        { id: 'ni_85', cat: 'Stats', title: 'Infinite', desc: '니트로 85+', diff: 6, check: (c, m) => checkStatExists(c, m, 'nitro', 85) },

        // === 8. KEY (5 items) ===
        { id: 'ky_1', cat: 'Key', title: 'Key Finder', desc: 'Key 차량 1대', diff: 3, check: (c, m) => countKeyCars(c, m) >= 1 },
        { id: 'ky_3', cat: 'Key', title: 'Key Hunter', desc: 'Key 차량 3대', diff: 5, check: (c, m) => countKeyCars(c, m) >= 3 },
        { id: 'ky_5', cat: 'Key', title: 'Key Master', desc: 'Key 차량 5대', diff: 6, check: (c, m) => countKeyCars(c, m) >= 5 },
        { id: 'ky_10', cat: 'Key', title: 'Key Lord', desc: 'Key 차량 10대', diff: 7, check: (c, m) => countKeyCars(c, m) >= 10 },

        // === 9. ETC (6 items) ===
        { id: 'start', cat: 'Etc', title: 'Welcome', desc: '첫 차 획득', diff: 1, check: c => c.length >= 1 },
        {
            id: 'etc_gp', cat: 'Etc', title: 'Grand Prix', desc: 'Grand Prix 차량 3대 (이름 포함)', diff: 5, check: (c, m) => {
                return c.filter(g => {
                    const r = m.find(x => String(x.id) === String(g.id));
                    return r && r.name.includes('GRAND PRIX');
                }).length >= 3;
            }
        }
    ];

    const AchievementManager = {
        _unlocked: [],
        _carsRef: [],

        DIFF: DIFF, // Expose for UI

        init: async function (carsData) {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                this._unlocked = saved ? JSON.parse(saved) : [];
            } catch (e) { this._unlocked = []; }

            if (carsData) this._carsRef = carsData;
            else {
                try {
                    const res = await fetch('../assets/cars.json');
                    this._carsRef = await res.json();
                } catch (e) { }
            }
        },

        checkAll: function (garageCars) {
            if (!this._carsRef || this._carsRef.length === 0) return [];
            const newUnlocks = [];

            DEFINITIONS.forEach(def => {
                if (this._unlocked.includes(def.id)) return;
                try {
                    if (def.check(garageCars, this._carsRef)) {
                        this._unlocked.push(def.id);
                        newUnlocks.push(def);
                    }
                } catch (e) { }
            });

            if (newUnlocks.length > 0) this._save();
            return newUnlocks;
        },

        getAll: function () {
            return DEFINITIONS.map(def => ({
                ...def,
                diffObj: DIFF[def.diff],
                unlocked: this._unlocked.includes(def.id)
            })).sort((a, b) => {
                // unlocked first, then difficulty desc, then category
                if (a.unlocked !== b.unlocked) return b.unlocked - a.unlocked;
                if (a.diff !== b.diff) return a.diff - b.diff; // Easier first
                return a.cat.localeCompare(b.cat);
            });
        },

        _save: function () {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._unlocked));
        },

        reset: function () {
            this._unlocked = [];
            this._save();
        }
    };

    root.AchievementManager = AchievementManager;

})(window);
