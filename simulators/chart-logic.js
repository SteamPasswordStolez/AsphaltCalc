
let rewardChartInstance = null;

function renderRewardChart(stageData) {
    const ctx = document.getElementById('rewardChart').getContext('2d');
    const labels = stageData.map(s => s.name);

    // Calculate cumulative
    let accCredits = 0;
    let accTokens = 0;

    const dataCredits = [];
    const dataTokens = [];

    stageData.forEach(s => {
        let sc = 0;
        let st = 0;
        if (s.unlocked || s.processed) { // Should we show potential or actual?
            // 'rewards' in stageStatusList has 'ok' flag.
            // s.rewards array.
            (s.rewards || []).forEach(r => {
                if (r.ok) {
                    const amt = (r.count || 0) * (r.mult || 1);
                    if (r.type === 'currency' && r.name === 'Credits') sc += amt;
                    if (r.type === 'currency' && r.name === 'Tokens') st += amt;
                    // Also handle other names slightly loosely if needed
                }
            });
        }
        accCredits += sc;
        accTokens += st;
        dataCredits.push(accCredits);
        dataTokens.push(accTokens);
    });

    if (rewardChartInstance) {
        rewardChartInstance.destroy();
    }

    rewardChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: I18N.t("se.th_cur_credits") || 'Credits',
                    data: dataCredits,
                    borderColor: '#facc15', // Yellow-400
                    backgroundColor: 'rgba(250, 204, 21, 0.1)',
                    yAxisID: 'y',
                    tension: 0.3
                },
                {
                    label: I18N.t("se.th_cur_tokens") || 'Tokens',
                    data: dataTokens,
                    borderColor: '#22d3ee', // Cyan-400
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: { color: '#9ca3af' } // gray-400
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: { color: '#facc15' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: { color: '#22d3ee' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}
