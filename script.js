document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT --- //
    const state = {
        q: 25,
        c: 25,
        d: 25,
        s: 25,
        isQualityLocked: false,
        isCostLocked: false,
        isDeliveryLocked: false,
        isScopeLocked: false,
        activePreset: 'softwareDevelopment'
    };

    // --- PRESET DEFINITIONS (The core logic for trade-offs) --- //
    const presets = {
        // ① ソフトウェア開発モデル
        softwareDevelopment: {
            // When Quality increases, points are taken from...
            quality: { cost: 0.6, delivery: 0.3, scope: 0.1 },
            // When Cost increases (constraint relaxed), points are taken from...
            cost:    { quality: 0.7, delivery: 0.2, scope: 0.1 },
            delivery:{ quality: 0.4, cost: 0.5, scope: 0.1 },
            scope:   { cost: 0.5, delivery: 0.4, quality: 0.1 }
        },
        // ② イベント企画モデル
        eventPlanning: {
            quality: { cost: 0.6, scope: 0.3, delivery: 0.1 },
            cost:    { quality: 0.5, scope: 0.4, delivery: 0.1 },
            delivery:{ cost: 0.7, quality: 0.2, scope: 0.1 },
            scope:   { cost: 0.6, quality: 0.3, delivery: 0.1 }
        },
        // ③ 資料作成モデル
        materialCreation: {
            quality: { delivery: 0.6, cost: 0.3, scope: 0.1 },
            cost:    { quality: 0.6, delivery: 0.3, scope: 0.1 },
            delivery:{ quality: 0.7, cost: 0.2, scope: 0.1 },
            scope:   { delivery: 0.5, quality: 0.3, cost: 0.2 }
        },
        // ④ 旅行計画モデル
        travelPlanning: {
            quality: { cost: 0.7, scope: 0.2, delivery: 0.1 },
            cost:    { quality: 0.6, scope: 0.3, delivery: 0.1 },
            delivery:{ cost: 0.4, scope: 0.4, quality: 0.2 },
            scope:   { cost: 0.5, quality: 0.3, delivery: 0.2 }
        },
        // ⑤ 資格試験の勉強モデル
        examStudy: {
            quality: { delivery: 0.6, cost: 0.3, scope: 0.1 },
            cost:    { quality: 0.6, delivery: 0.3, scope: 0.1 },
            delivery:{ quality: 0.7, scope: 0.2, cost: 0.1 },
            scope:   { quality: 0.4, delivery: 0.4, cost: 0.2 }
        },
        // ⑥ 創作活動モデル
        creativeWork: {
            quality: { delivery: 0.5, cost: 0.4, scope: 0.1 },
            cost:    { quality: 0.5, delivery: 0.4, scope: 0.1 },
            delivery:{ quality: 0.8, cost: 0.1, scope: 0.1 },
            scope:   { quality: 0.4, delivery: 0.4, cost: 0.2 }
        }
    };
    
    // --- DOM ELEMENT CACHING --- //
    const dom = {
        presetSelector: document.getElementById('preset-selector'),
        sliders: {
            quality: document.getElementById('quality-slider'),
            cost: document.getElementById('cost-slider'),
            delivery: document.getElementById('delivery-slider'),
            scope: document.getElementById('scope-slider'),
        },
        values: {
            quality: document.getElementById('quality-value'),
            cost: document.getElementById('cost-value'),
            delivery: document.getElementById('delivery-value'),
            scope: document.getElementById('scope-value'),
        },
        locks: {
            quality: document.getElementById('quality-lock'),
            cost: document.getElementById('cost-lock'),
            delivery: document.getElementById('delivery-lock'),
            scope: document.getElementById('scope-lock'),
        },
        analysis: {
            scoreDisplay: document.getElementById('score-display'),
            summaryAdvice: document.getElementById('summary-advice'),
            radarChart: document.getElementById('radar-chart'),
            patternAnalysis: document.getElementById('pattern-analysis'),
            presetAdvice: document.getElementById('preset-advice'),
        },
        exportButton: document.getElementById('export-button'),
        analysisPanel: document.getElementById('analysis-panel'),
    };
    
    // Chart.js instance
    let chartInstance = null;
    
    // --- CORE LOGIC FUNCTIONS --- //

    /**
     * Handles slider interaction, calculates the change, and redistributes points.
     * @param {string} changedParam - The parameter that was changed ('quality', 'cost', etc.).
     * @param {number} newValue - The new value from the slider.
     */
    function handleSliderChange(changedParam, newValue) {
        const oldValue = state[paramMapping[changedParam].stateKey];
        const delta = newValue - oldValue;

        if (delta === 0) return;

        state[paramMapping[changedParam].stateKey] = newValue;
        redistributePoints(changedParam, delta);

        updateAllUI();
    }

    /**
     * Redistributes points among unlocked sliders based on the active preset.
     * @param {string} changedParam - The parameter that initiated the change.
     * @param {number} delta - The amount of change.
     */
    function redistributePoints(changedParam, delta) {
        const unlockedSliders = Object.keys(paramMapping).filter(p => p !== changedParam && !state[paramMapping[p].lockKey]);
        
        if (unlockedSliders.length === 0) {
            // If all others are locked, revert the change and rebalance.
            normalizeAndBalance();
            return;
        }

        const weights = presets[state.activePreset][changedParam];
        
        let totalWeight = unlockedSliders.reduce((sum, p) => sum + (weights[p] || 0), 0);
        
        // If there's no weight defined for unlocked sliders, distribute evenly
        if (totalWeight === 0) {
            unlockedSliders.forEach(p => {
                state[paramMapping[p].stateKey] -= delta / unlockedSliders.length;
            });
        } else {
             unlockedSliders.forEach(p => {
                const share = (weights[p] || 0) / totalWeight;
                state[paramMapping[p].stateKey] -= delta * share;
            });
        }
        
        normalizeAndBalance();
    }
    
    /**
     * Ensures all values are within 0-100 and the total sum is exactly 100.
     */
    function normalizeAndBalance() {
        let total = 0;
        const params = Object.keys(paramMapping);

        // Clamp values between 0 and 100
        params.forEach(p => {
            const key = paramMapping[p].stateKey;
            state[key] = Math.max(0, Math.min(100, state[key]));
            total += state[key];
        });

        let diff = 100 - total;
        
        // Distribute rounding errors
        const unlocked = params.filter(p => !state[paramMapping[p].lockKey]);
        const adjustable = unlocked.length > 0 ? unlocked : params; // Fallback to all if all are locked

        if (adjustable.length > 0) {
           for (let i = 0; i < Math.abs(diff); i++) {
                const paramToAdjust = adjustable[i % adjustable.length];
                const key = paramMapping[paramToAdjust].stateKey;
                const adjustment = Math.sign(diff);

                if (state[key] + adjustment >= 0 && state[key] + adjustment <= 100) {
                    state[key] += adjustment;
                } else {
                    // Try to adjust another parameter if one hits a boundary
                    // This is a simple fallback. A more complex one might be needed for edge cases.
                    const nextParam = adjustable[(i + 1) % adjustable.length];
                    const nextKey = paramMapping[nextParam].stateKey;
                     if (state[nextKey] + adjustment >= 0 && state[nextKey] + adjustment <= 100) {
                        state[nextKey] += adjustment;
                     }
                }
            }
        }
        
        // Final check for total sum
        total = params.reduce((sum, p) => sum + state[paramMapping[p].stateKey], 0);
        
        if (total !== 100) {
             const finalDiff = 100 - total;
             const paramToAdjustKey = paramMapping[adjustable[0]].stateKey;
             state[paramToAdjustKey] += finalDiff;
        }

        // Round all values
        params.forEach(p => {
            const key = paramMapping[p].stateKey;
            state[key] = Math.round(state[key]);
        });
        normalizeAndBalanceFinalPass();
    }
    
    /**
     * A final pass to ensure the total is exactly 100 after rounding.
     */
    function normalizeAndBalanceFinalPass() {
        const params = Object.keys(paramMapping);
        let total = params.reduce((sum, p) => sum + state[paramMapping[p].stateKey], 0);
        let diff = 100 - total;

        if (diff !== 0) {
            const unlocked = params.filter(p => !state[paramMapping[p].lockKey] && (diff > 0 ? state[paramMapping[p].stateKey] < 100 : state[paramMapping[p].stateKey] > 0));
            const adjustable = unlocked.length > 0 ? unlocked : params;

            if (adjustable.length > 0) {
                const keyToAdjust = paramMapping[adjustable[0]].stateKey;
                state[keyToAdjust] += diff;
            }
        }
    }


    /**
     * Toggles the lock state for a given parameter.
     * @param {string} param - The parameter to toggle ('quality', 'cost', etc.).
     */
    function toggleLock(param) {
        const lockKey = paramMapping[param].lockKey;
        state[lockKey] = !state[lockKey];
        updateAllUI();
    }
    
    // --- UI UPDATE FUNCTIONS --- //
    
    /**
     * Updates all UI elements to reflect the current state.
     */
    function updateAllUI() {
        updateSlidersAndValues();
        updateLockButtons();
        updateAnalysisPanel();
        drawRadarChart();
    }

    /**
     * Updates sliders and their numeric value displays.
     */
    function updateSlidersAndValues() {
        for (const param in paramMapping) {
            const { stateKey } = paramMapping[param];
            const value = Math.round(state[stateKey]);
            dom.sliders[param].value = value;
            dom.values[param].textContent = value;
        }
    }

    /**
     * Updates lock buttons visuals and slider disabled state.
     */
    function updateLockButtons() {
        for (const param in paramMapping) {
            const { lockKey } = paramMapping[param];
            const isLocked = state[lockKey];
            const lockButton = dom.locks[param];
            const slider = dom.sliders[param];
            
            slider.disabled = isLocked;
            lockButton.classList.toggle('locked', isLocked);
            lockButton.querySelector('i').className = isLocked ? 'fas fa-lock' : 'fas fa-lock-open';
        }
    }

    /**
     * Updates the entire analysis panel with new scores and text.
     */
    function updateAnalysisPanel() {
        const { q, c, d, s } = state;
        const values = [q, c, d, s];

        // 1. Calculate Score
        const average = values.reduce((a, b) => a + b, 0) / values.length; // Will always be 25
        const std_dev = Math.sqrt(values.map(x => Math.pow(x - average, 2)).reduce((a, b) => a + b) / values.length);
        const score = Math.round(average * 0.8 + (50 - std_dev) * 0.4); // Score formula

        // 2. Determine Rank and Advice
        let rank, summaryAdvice;
        if (score >= 90) { rank = 'S'; summaryAdvice = '完璧なバランスです！理想的な計画と言えるでしょう。'; }
        else if (score >= 80) { rank = 'A'; summaryAdvice = '非常に優れたバランスです。この計画で進めましょう。'; }
        else if (score >= 65) { rank = 'B'; summaryAdvice = '良いバランスです。いくつかの微調整で更によくなります。'; }
        else if (score >= 50) { rank = 'C'; summaryAdvice = '標準的なバランスですが、改善の余地があります。'; }
        else { rank = 'D'; summaryAdvice = 'バランスに課題があります。各項目を見直すことを推奨します。'; }
        
        dom.analysis.scoreDisplay.textContent = `総合評価: ${rank} (${score}点)`;
        dom.analysis.summaryAdvice.textContent = summaryAdvice;

        // 3. Generate Analysis Text
        dom.analysis.patternAnalysis.textContent = getPatternAnalysis(q, c, d, s);
        dom.analysis.presetAdvice.textContent = getPresetAdvice(state.activePreset, q, c, d, s);
    }
    
    // --- ANALYSIS TEXT GENERATION --- //
    
    function getPatternAnalysis(q, c, d, s) {
        if (q > 60) return "品質最優先型: 非常に高い品質を追求していますが、その分コストや納期、スコープが犠牲になっています。";
        if (c > 60) return "コスト最優先型: コストを抑えることに成功していますが、品質やスコープが不十分になる可能性があります。";
        if (d > 60) return "納期最優先型: 迅速な完了が見込めますが、品質が低下したり、機能が削られている可能性があります。";
        if (s > 60) return "スコープ最優先型: 多くの機能や要件を盛り込んでいますが、予算や期間内に収まらないリスクがあります。";
        if (q < 10 && d < 10) return "リスク型: 品質も納期も低い状態です。プロジェクトの目標が達成できない危険性があります。";
        const maxVal = Math.max(q, c, d, s);
        const minVal = Math.min(q, c, d, s);
        if (maxVal - minVal > 50) return "極端な偏り型: 特定の要素が突出しており、他の要素が極端に低いです。計画の実現可能性を再検討する必要があります。";
        return "バランス型: 特定の要素に偏りがなく、バランスが取れています。安定したプロジェクト進行が期待できます。";
    }

    function getPresetAdvice(preset, q, c, d, s) {
        switch (preset) {
            case 'softwareDevelopment':
                if (q > 50 && d < 15) return "[ソフトウェア開発] 高品質を目指すあまり、納期が非常に厳しくなっています。リリースの延期や、スコープの削減を検討しましょう。";
                if (s > 50 && c < 15) return "[ソフトウェア開発] 要求機能が多すぎで、予算が不足しています。優先順位の低い機能を次のフェーズに回すことを推奨します。";
                return "[ソフトウェア開発] バランス型。機能、品質、予算、スケジュールのいずれかを優先して、プロジェクトの方向性を定めましょう。";
            case 'eventPlanning':
                if (d < 20) return "[イベント企画] 準備期間が非常に短いです。集客やリハーサルの時間は確保できていますか？";
                if (c > 50 && q < 15) return "[イベント企画] 予算を抑えすぎて、イベントの魅力（品質）が損なわれる危険性があります。";
                return "[イベント企画] バランスの取れた計画です。当日の成功に向けて、着実に準備を進めましょう。";
            case 'materialCreation':
                if (q > 60) return "[資料作成] クオリティにこだわりすぎていませんか？メッセージが伝わることが最も重要です。";
                if (d < 15) return "[資料作成] 納期が短すぎます。誤字脱字や情報の誤りがないか、レビューの時間を確保してください。";
                return "[資料作成] 分かりやすく、期限内に提出できる良いバランスです。";
            case 'travelPlanning':
                if (q > 50 && c > 50) return "[旅行計画] 最高の体験を求めていますが、予算がかなり高くなっています。";
                if (s < 20) return "[旅行計画] 行きたい場所ややりたいこと（スコープ）が少ないようです。もっと欲張ってもいいかもしれません。";
                return "[旅行計画] 予算と満足度のバランスが取れた、楽しい旅行になりそうです。";
            case 'examStudy':
                if (q < 20) return "[資格試験] 合格の可能性（品質）が低いです。学習時間（納期）や学習範囲（スコープ）の見直しが必要です。";
                if (d > 60) return "[資格試験] 十分な学習時間を確保できています。この調子で続ければ合格が見えてきます。";
                return "[資格試験] 無理のない学習計画です。継続することが合格への鍵です。";
            case 'creativeWork':
                if (d > 70) return "[創作活動] 制作に多くの時間を費やしています。素晴らしい作品が生まれそうですが、完成までのモチベーション維持が鍵です。";
                if (q < 15) return "[創作活動] もっと作品のクオリティにこだわってみませんか？時間をかける価値はあるかもしれません。";
                return "[創作活動] バランスの取れた創作活動ができています。楽しんで制作を続けましょう。";
            default:
                return "現在のバランスに基づいた汎用的なアドバイスです。";
        }
    }
    
    // --- CHART DRAWING --- //

    /**
     * Draws the radar chart on the canvas.
     */
    function drawRadarChart() {
        const ctx = dom.analysis.radarChart.getContext('2d');
        const { q, c, d, s } = state;
        const width = dom.analysis.radarChart.width;
        const height = dom.analysis.radarChart.height;
        const center = width / 2;
        const radius = width * 0.4;

        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const r = radius * (i / 4);
            ctx.beginPath();
            ctx.moveTo(center + r, center);
            ctx.lineTo(center, center - r);
            ctx.lineTo(center - r, center);
            ctx.lineTo(center, center + r);
            ctx.closePath();
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(center, center - radius); ctx.lineTo(center, center + radius); // Vertical
        ctx.moveTo(center - radius, center); ctx.lineTo(center + radius, center); // Horizontal
        ctx.stroke();

        // Draw data shape
        const qPos = { x: center, y: center - (radius * q / 100) };
        const cPos = { x: center + (radius * c / 100), y: center };
        const dPos = { x: center, y: center + (radius * d / 100) };
        const sPos = { x: center - (radius * s / 100), y: center };

        ctx.beginPath();
        ctx.moveTo(qPos.x, qPos.y);
        ctx.lineTo(cPos.x, cPos.y);
        ctx.lineTo(dPos.x, dPos.y);
        ctx.lineTo(sPos.x, sPos.y);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(0, 123, 255, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Q', center, center - radius - 8);
        ctx.textAlign = 'left';
        ctx.fillText('C', center + radius + 8, center + 4);
        ctx.textAlign = 'center';
        ctx.fillText('D', center, center + radius + 15);
        ctx.textAlign = 'right';
        ctx.fillText('S', center - radius - 8, center + 4);
    }
    
    // --- EVENT LISTENERS --- //
    
    // Helper object to map slider IDs to state keys
    const paramMapping = {
        quality: { stateKey: 'q', lockKey: 'isQualityLocked' },
        cost: { stateKey: 'c', lockKey: 'isCostLocked' },
        delivery: { stateKey: 'd', lockKey: 'isDeliveryLocked' },
        scope: { stateKey: 's', lockKey: 'isScopeLocked' },
    };
    
    // Attach event listeners to sliders
    for (const param in dom.sliders) {
        let lastValue = state[paramMapping[param].stateKey];
        dom.sliders[param].addEventListener('input', (e) => {
            const newValue = parseInt(e.target.value, 10);
            handleSliderChange(param, newValue);
            lastValue = newValue;
        });
    }

    // Attach event listeners to lock buttons
    for (const param in dom.locks) {
        dom.locks[param].addEventListener('click', () => toggleLock(param));
    }
    
    // Preset selector change
    dom.presetSelector.addEventListener('change', (e) => {
        state.activePreset = e.target.value;
        updateAllUI(); // Re-evaluate advice based on new preset
    });
    
    // Export button click
    dom.exportButton.addEventListener('click', () => {
        // Temporarily remove shadow for cleaner export
        const originalShadow = dom.analysisPanel.style.boxShadow;
        dom.analysisPanel.style.boxShadow = 'none';

        html2canvas(dom.analysisPanel, { 
            scale: 2, // Higher resolution
            backgroundColor: null, // Use element's background
            onclone: (document) => { // Ensure styles are applied in the clone
                document.getElementById('analysis-panel').style.boxShadow = 'none';
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'qcds_simulator_result.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Restore shadow
            dom.analysisPanel.style.boxShadow = originalShadow;
        }).catch(err => {
            console.error('oops, something went wrong!', err);
            // Restore shadow even on error
            dom.analysisPanel.style.boxShadow = originalShadow;
        });
    });

    // --- INITIALIZATION --- //
    function init() {
        updateAllUI();
    }

    init();
});
