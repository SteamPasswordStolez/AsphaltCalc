/**
 * garage.js
 * Handles "My Garage" data persistence using localStorage.
 * Key: 'simhub_my_garage_v1'
 */

(function (root) {
    const STORAGE_KEY = 'simhub_my_garage_v1';

    const GarageManager = {
        _data: null,

        _load: function () {
            if (this._data) return;
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                this._data = raw ? JSON.parse(raw) : {};
            } catch (e) {
                console.error("Garage Load Error:", e);
                this._data = {};
            }
        },

        _save: function () {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
            } catch (e) {
                console.error("Garage Save Error:", e);
            }
        },

        /**
         * Get a specific car's data
         * @param {string|number} id 
         * @returns {object|null} Saved data or null
         */
        getCar: function (id) {
            this._load();
            return this._data[String(id)] || null;
        },

        /**
         * Check if a car is in garage (owned)
         * @param {string|number} id
         */
        hasCar: function (id) {
            return !!this.getCar(id);
        },

        /**
         * Save car data
         * @param {string|number} id 
         * @param {object} data - { star, stage, parts: {...}, etc }
         */
        saveCar: function (id, data) {
            this._load();
            const sid = String(id);
            this._data[sid] = {
                ...this._data[sid],
                ...data,
                id: sid,
                updatedAt: Date.now()
            };
            this._save();
        },

        /**
         * Remove car from garage
         * @param {string|number} id 
         */
        deleteCar: function (id) {
            this._load();
            const sid = String(id);
            if (this._data[sid]) {
                delete this._data[sid];
                this._save();
            }
        },

        /**
         * Get all garage cars
         * @returns {Array} List of car objects
         */
        getAll: function () {
            this._load();
            return Object.values(this._data).sort((a, b) => b.updatedAt - a.updatedAt);
        },

        /**
         * Import/Export support
         */
        exportData: function () {
            this._load();
            return JSON.stringify(this._data);
        },

        importData: function (jsonStr) {
            try {
                const parsed = JSON.parse(jsonStr);
                if (parsed && typeof parsed === 'object') {
                    this._data = { ...this._data, ...parsed };
                    this._save();
                    return true;
                }
            } catch (e) {
                return false;
            }
        },

        /**
         * Overwrite all data (for Restore/Undo)
         * @param {object} newData 
         */
        overwrite: function (newData) {
            if (newData && typeof newData === 'object') {
                this._data = JSON.parse(JSON.stringify(newData)); // Deep copy safety
                this._save();
                return true;
            }
            return false;
        },

        /**
         * Clear all garage data
         */
        clearAll: function () {
            this._data = {};
            this._save();
        }
    };

    // Expose to global
    root.GarageManager = GarageManager;

})(window);
