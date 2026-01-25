/**
 * efficiency.js (v4.0)
 * Hybrid System: Expert Tier List + Performance Density Calculation
 * Priorities:
 * 1. Expert Verified List (Absolute Trust)
 * 2. Performance Density (Data Analysis)
 * 3. Fallback Estimation (Missing Data)
 */

(function (root) {
    // Verified by Community Experts (Global & Reddit & YouTube)
    const EXPERT_TIERS = {
        // D Class Kings & Essentials
        D: {
            "DS E-TENSE": "S",
            "LOTUS ELISE SPRINT 220": "S",
            "MAZDA FURAI": "S",
            "PORSCHE TAYCAN TURBO S": "S",
            "CHEVROLET CORVETTE C7.R": "A",
            "LAMBORGHINI HURACÁN SUPER TROFEO EVO": "A",
            "GINETTA G60": "A",
            "TVR GRIFFITH": "A",
            "VOLKSWAGEN ELECTRIC R": "A" // ID.R
        },
        // C Class
        C: {
            "FERRARI 599XX EVO": "S",
            "MCLAREN GT": "S",
            "PANAMERA TURBO S": "S",
            "ARRINERA HUSSARYA 33": "S",
            "ACURA 2017 NSX": "A",
            "PININFARINA H2 SPEED": "A",
            "DODGE VIPER ACR": "A",
            "MASERATI ALFIERI": "A",
            "BRABHAM BT62": "A"
        },
        // B Class
        B: {
            "LAMBORGHINI HURACÁN EVO SPYDER": "S",
            "CHEVROLET CORVETTE GRAND SPORT": "S",
            "PORSCHE 911 GT3 RS": "S",
            "W MOTORS LYKAN HYPERSPORT": "A", // Good for slipstream
            "APOLLO N": "A",
            "MCLAREN F1 LM": "S",
            "FERRARI 488 GTB CHALLENGE EVO": "S",
            "PAGANI HUAYRA R": "S"
        },
        // A Class
        A: {
            "VANDA ELECTRICS DENDROBIUM": "S",
            "PAGANI IMOLA": "S",
            "PAGANI HUAYRA BC": "S",
            "CITROËN GT BY CITROËN": "A",
            "PORSCHE 918 SPYDER": "A",
            "FERRARI LAFERRARI APERTA": "A",
            "LAMBORGHINI COUNTACH LPI 800-4": "S",
            "MCLAREN 570S SPIDER": "A"
        },
        // S Class
        S: {
            "BUGATTI CHIRON": "S",
            "KOENIGSEGG JESKO": "S",
            "SSC TUATARA": "S",
            "RIMAC NEVERA": "S",
            "TRION NEMESIS": "A",
            "LAMBORGHINI SIAN FKP 37": "A",
            "AUTOMOBILI PININFARINA BATTISTA": "S",
            "BUGATTI BOLIDE": "S"
        }
    };

    const EfficiencyManager = {
        _cars: null,
        _upgrades: null,
        _initialized: false,
        _stats: {},

        init: async function (carsData, upgradesData) {
            if (this._initialized) return;

            try {
                if (carsData) this._cars = carsData;
                else {
                    const res = await fetch('../assets/cars.json');
                    this._cars = await res.json();
                }

                if (upgradesData) this._upgrades = upgradesData;
                else {
                    const res = await fetch('../assets/upgrades.json');
                    this._upgrades = await res.json();
                }

                this._preprocess();
                this._initialized = true;

            } catch (e) {
                console.error("EfficiencyManager init failed:", e);
            }
        },

        isReady: function () {
            return this._initialized;
        },

        _preprocess: function () {
            // v5.0 Logic: Relative Class Ranking System
            // Instead of trying to find a "Perfect Formula", we simply RANK cars within their class.
            // A car is "S Tier" if it is in the Top 3 or Top 5% of its class in terms of utility.

            const classCosts = { D: [], C: [], B: [], A: [], S: [] };
            const avgCosts = {};

            this._cars.forEach(car => {
                const u = this._upgrades.find(x => x.name === car.name || x.id == car.id);
                if (u) {
                    const cost = u.final_total_cost || u.upgrade_all;
                    if (cost > 0 && classCosts[car.class]) classCosts[car.class].push(cost);
                }
            });

            for (const c in classCosts) {
                if (classCosts[c].length > 0) {
                    const sum = classCosts[c].reduce((a, b) => a + b, 0);
                    avgCosts[c] = sum / classCosts[c].length;
                } else {
                    avgCosts[c] = (c === 'S' ? 30000000 : c === 'A' ? 15000000 : c === 'B' ? 8000000 : c === 'C' ? 4000000 : 1000000);
                }
            }

            const scoresByClass = { D: [], C: [], B: [], A: [], S: [] };

            const getUtilityScore = (stat) => {
                if (!stat) return 0;
                // Focusing heavily on Accel/Speed balance
                return (stat.top_speed * 1.0) + (stat.accel * 1.5) + (stat.nitro * 0.7) + (stat.handling * 0.5);
            };

            // 1. Calculate Raw Scores
            this._cars.forEach(car => {
                let cost = 0;
                let isEstimated = false;

                const upgradeInfo = this._upgrades.find(u => u.name === car.name || u.id == car.id);
                if (upgradeInfo) cost = upgradeInfo.final_total_cost || upgradeInfo.upgrade_all;
                if (!cost || cost <= 0) { cost = avgCosts[car.class]; isEstimated = true; }

                let maxStat = car.stat.find(s => s.type === 'gold');
                if (!maxStat) maxStat = car.stat.find(s => s.type === 'full');
                if (!maxStat) maxStat = car.stat[car.stat.length - 1];

                if (!maxStat) return;

                const utility = getUtilityScore(maxStat);
                // Rank Efficiency: Performance per Rank Point (Anti-Sandbagging)
                const rankEff = utility / Math.max(1, maxStat.rank);

                // Pure Performance Score (ignoring rank/cost for a moment)
                // We want to know: Is this car actually GOOD?
                const performanceScore = utility;

                // Final Hybrid Score: 70% Real Performance + 30% Rank Efficiency
                // We barely care about Cost in the ranking itself, cost is for 'Value' badge.
                let finalScore = (performanceScore * 0.7) + (rankEff * 2000 * 0.3);

                // Tier List Bonus remains as a boost
                const expertTier = this._checkExpertTier(car);
                if (expertTier === 'S') finalScore *= 1.3;
                if (expertTier === 'A') finalScore *= 1.15;

                car._effRawScore = finalScore;
                car._totalCost = cost;
                car._isEstimated = isEstimated;
                car._isExpert = !!expertTier;

                if (scoresByClass[car.class]) scoresByClass[car.class].push({ id: car.id, score: finalScore });
            });

            // 2. Rank within Class
            this._rankings = {};
            for (const c in scoresByClass) {
                // Sort Descending (Higher is better)
                scoresByClass[c].sort((a, b) => b.score - a.score);

                this._rankings[c] = scoresByClass[c].map((item, index) => ({
                    id: item.id,
                    rank: index + 1, // 1st, 2nd, 3rd...
                    total: scoresByClass[c].length,
                    percentile: (index / scoresByClass[c].length) * 100 // 0% is top
                }));
            }
        },

        _getPercentile: function (arr, p) { return 0; }, // Deprecated

        analyze: function (carId) {
            if (!this._initialized) return null;

            const car = this._cars.find(c => c.id == carId);
            if (!car || !car._effRawScore) return null;

            const classRanks = this._rankings[car.class];
            const myRankInfo = classRanks ? classRanks.find(r => r.id == car.id) : null;

            if (!myRankInfo) return { grade: 'B', isEstimated: true, alternatives: [] };

            // Determine Grade by Class Positioning
            let grade = 'B';
            const p = myRankInfo.percentile;

            if (myRankInfo.rank <= 3) grade = 'S'; // Top 3 is always S (King)
            else if (p <= 15) grade = 'S'; // Top 15%
            else if (p <= 40) grade = 'A'; // Top 40%
            else if (p <= 80) grade = 'B';
            else grade = 'F';

            // Override for Experts
            if (car._isExpert && grade !== 'S') grade = 'A'; // Experts are at least A

            let isTrap = (grade === 'F');

            // Alternatives: Cars ranked higher 
            let alternatives = [];
            if (grade === 'F' || grade === 'B') {
                // Suggest cars in Top 20% of same class
                const topCars = classRanks.filter(r => r.percentile <= 20).slice(0, 3);
                alternatives = topCars.map(r => this._cars.find(c => c.id == r.id)).filter(c => c && c.id !== car.id);
            }

            return {
                grade: grade,
                score: car._effRawScore,
                classRank: myRankInfo.rank,
                classTotal: myRankInfo.total,
                isTrap: isTrap,
                cost: car._totalCost,
                isEstimated: car._isEstimated,
                isExpert: car._isExpert,
                alternatives: alternatives.map(c => ({ id: c.id, name: c.name }))
            };
        },

        _checkExpertTier: function (car) {
            if (!car || !car.class) return null;
            const tiers = EXPERT_TIERS[car.class];
            if (!tiers) return null;

            // Name matching (Case insensitive normalization might be needed if exact match fails)
            // But usually cars.json names upper case match.
            // Check direct name match
            if (tiers[car.name]) return tiers[car.name];

            // Check if name contains key (e.g. "PORSCHE 911 GT3 RS" vs "PORSCHE 911 GT3 RS WEISSACH PACKAGE")
            for (const key in tiers) {
                if (car.name.includes(key)) return tiers[key];
            }
            return null;
        }
    };

    root.EfficiencyManager = EfficiencyManager;

})(window);
