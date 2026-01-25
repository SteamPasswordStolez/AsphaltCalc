/**
 * goal_advisor.js V2.2 (Score Scaling Fix)
 * Analyzes garage data and suggests the most efficient "Next Steps" for growth.
 * Uses real data from cars.json and upgrades.json.
 */

(function (root) {
    const GoalAdvisor = {
        _cars: null,
        _upgrades: null,
        _garage: null,

        init: async function (garageData) {
            this._garage = garageData;

            // Ensure EfficiencyManager is ready
            if (root.EfficiencyManager && !root.EfficiencyManager.isReady()) {
                await root.EfficiencyManager.init(); // Auto-fetch internal data
            }

            if (root.EfficiencyManager && root.EfficiencyManager.isReady()) {
                this._cars = root.EfficiencyManager._cars;
                this._upgrades = root.EfficiencyManager._upgrades;
            } else {
                const cRes = await fetch('../assets/cars.json');
                this._cars = await cRes.json();
                const uRes = await fetch('../assets/upgrades.json');
                this._upgrades = await uRes.json();
            }
        },

        getSuggestions: function () {
            if (!this._cars || !this._upgrades || !this._garage) return [];

            const candidates = [];

            this._cars.forEach(car => {
                const myCar = this._garage[car.id];
                const upgradeInfo = this._upgrades.find(u => u.name === car.name || u.id == car.id);

                // 1. Get Efficiency Score
                let effScore = 0;
                let effGrade = 'C';
                let isExpert = false;

                if (root.EfficiencyManager) {
                    const analysis = root.EfficiencyManager.analyze(car.id);
                    if (analysis) {
                        effScore = analysis.score;
                        effGrade = analysis.grade;
                        isExpert = analysis.isExpert;
                    }
                }

                // Skip bad cars
                if (effGrade === 'F' && !isExpert) return;

                // Helper to calc display score
                const getDisplayScore = (grade, rawScore) => {
                    let base = 50;
                    if (grade === 'S') base = 95;
                    else if (grade === 'A') base = 85;
                    else if (grade === 'B') base = 70;

                    // Add variability (0.0 ~ 4.9)
                    let bonus = (rawScore % 50) / 10;
                    if (grade === 'S') bonus = Math.min(4.9, bonus);

                    return (base + bonus).toFixed(1);
                };

                if (!myCar) {
                    // [UNLOCK GOAL]
                    const unlockBP = (car.bp_requirements && car.bp_requirements.length > 0)
                        ? car.bp_requirements[0]
                        : (car.unlock_method === 'key' ? 0 : 40);

                    let priority = effScore;
                    if (isExpert) priority *= 2.0;
                    if (car.class === 'D') priority *= 1.5;
                    if (car.class === 'C') priority *= 1.2;

                    candidates.push({
                        id: car.id,
                        name: car.name,
                        type: 'UNLOCK',
                        current: '미보유',
                        target: '⭐️ 1성 해금',
                        reqBP: unlockBP,
                        costVal: 0,
                        costLabel: unlockBP > 0 ? `BP ${unlockBP}장 필요` : '열쇠/이벤트 획득',
                        score: priority,

                        // Metrics
                        normalizedScore: getDisplayScore(effGrade, effScore),
                        tier: effGrade,
                        isExpert: isExpert,

                        effLabel: this._getEffLabel(priority),
                        effScore: effScore,
                        reason: this._generateReason(car, isExpert, 'UNLOCK', effGrade)
                    });

                } else {
                    // [UPGRADE GOAL]
                    const curStar = myCar.star || 1;
                    if (curStar < car.max_star) {
                        const nextStar = curStar + 1;
                        let neededBP = 0;
                        if (car.bp_requirements && car.bp_requirements.length >= curStar + 1) {
                            neededBP = car.bp_requirements[curStar];
                        } else {
                            neededBP = 30 + (curStar * 10);
                        }

                        let estimatedCredit = 200000 * curStar;
                        if (upgradeInfo && upgradeInfo.final_total_cost) {
                            estimatedCredit = Math.round(upgradeInfo.final_total_cost / car.max_star);
                        }

                        let priority = effScore;
                        if (isExpert) priority *= 1.5;
                        if (nextStar === car.max_star) priority *= 1.1;

                        candidates.push({
                            id: car.id,
                            name: car.name,
                            type: 'UPGRADE',
                            current: `${curStar}성`,
                            target: `${nextStar}성 승급`,
                            reqBP: neededBP,
                            costVal: estimatedCredit,
                            costLabel: `약 ${this._formatMoney(estimatedCredit)} + BP ${neededBP}장`,
                            score: priority,

                            // Metrics
                            normalizedScore: getDisplayScore(effGrade, effScore),
                            tier: effGrade,
                            isExpert: isExpert,

                            effLabel: this._getEffLabel(priority),
                            effScore: effScore,
                            reason: this._generateReason(car, isExpert, 'UPGRADE', effGrade)
                        });
                    }
                }
            });

            candidates.sort((a, b) => b.score - a.score);
            return candidates.slice(0, 3);
        },

        _getEffLabel: function (score) {
            if (score > 1500) return '★★★★★';
            if (score > 1000) return '★★★★☆';
            if (score > 600) return '★★★☆☆';
            return '★★☆☆☆';
        },

        _formatMoney: function (num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
            return num;
        },

        _generateReason: function (car, isExpert, type, grade) {
            if (isExpert) return `고수들의 필수 픽(Expert Pick)! ${car.class}클래스 대장차입니다. 무조건 키우세요.`;
            if (grade === 'S') return `투자 효율 S등급! 동급 최강 성능을 자랑합니다.`;
            if (grade === 'A') return `투자 효율 A등급. 가성비와 성능 모두 훌륭합니다.`;
            if (type === 'UNLOCK') {
                if (car.class === 'D') return '초반 성장에 아주 유용한 고효율 차량입니다.';
                return '차고 점수와 멀티 성능 모두 챙길 수 있는 좋은 선택입니다.';
            }
            return '적절한 투자로 확실한 성능 향상을 체감할 수 있습니다.';
        }
    };

    root.GoalAdvisor = GoalAdvisor;

})(window);
