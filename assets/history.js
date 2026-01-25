/**
 * history.js
 * Tracks garage growth history and daily logs.
 */

(function (root) {
    const STORAGE_KEY = 'asphalt_garage_history';

    const HistoryManager = {
        _data: {
            logs: [],       // Activity logs: { ts, type, carName, desc, cost, scoreDelta }
            snapshots: []   // Daily stats: { date, totalScore, totalCars, totalValue }
        },

        _initialized: false,

        init: function () {
            if (this._initialized) return;
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Merge strategies if needed, currently direct overwrite
                    this._data = parsed;
                    // Ensure structure
                    if (!this._data.logs) this._data.logs = [];
                    if (!this._data.snapshots) this._data.snapshots = [];
                } catch (e) {
                    console.error('History data corrupted', e);
                }
            }
            this._initialized = true;
            // Check for daily snapshot on load is manual
        },

        save: function () {
            if (!this._initialized) this.init();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
        },

        /**
         * Log an activity
         */
        logEvent: function (type, car, desc, cost) {
            if (!this._initialized) this.init();

            const entry = {
                ts: Date.now(),
                type: type,
                carName: car.name || car.id,
                desc: desc,
                cost: cost || 0
            };

            // Limit logs to last 100 entries to save space
            this._data.logs.unshift(entry);
            if (this._data.logs.length > 100) this._data.logs.pop();

            this.save();
            console.log(`[History] ${type}: ${entry.carName} (${desc})`);
        },

        /**
         * Take a daily snapshot of garage stats
         * Should be called when GarageManager is ready
         */
        _checkDailySnapshot: function () {
            // This requires GarageManager data. If not ready, we might need to be called explicitly later.
            // We'll rely on explicit call from my_garage.html after load.
        },

        forceSnapshot: function (garageStats) {
            const today = new Date().toISOString().slice(0, 10);
            const lastSnap = this._data.snapshots[this._data.snapshots.length - 1];

            if (!lastSnap || lastSnap.date !== today) {
                this._data.snapshots.push({
                    date: today,
                    totalCars: garageStats.totalCars || 0,
                    totalScore: garageStats.totalScore || 0, // Placeholder if we don't have real garage score
                    totalValue: garageStats.totalValue || 0
                });

                // Keep last 365 days
                if (this._data.snapshots.length > 365) this._data.snapshots.shift();

                this.save();
                console.log(`[History] Daily snapshot taken for ${today}`);
            }
        }
    };

    root.HistoryManager = HistoryManager;

})(window);
