const HISTORY_STORAGE_KEY = 'ecotrack-history';
const THEME_STORAGE_KEY = 'ecotrack-theme';
const INDIA_AVG = 1.9;
const MAX_HISTORY_ENTRIES = 6;
const PHONE_CHARGE_CO2_KG = 0.008;
const FLIGHT_CO2_KG = 170;
const TREE_OFFSET_KG = 21.7;
const AVG_KM_PER_LITRE = 15;

const EF = {
    electricity: {
        National: 0.82,
        Delhi: 0.97,
        Karnataka: 0.62,
        Maharashtra: 0.72,
        Gujarat: 0.78,
        TamilNadu: 0.84
    },
    petrol: 2.31,
    train: 0.041,
    lpg: 2.98,
    diet: {
        vegan: 100,
        vegetarian: 150,
        omnivore: 250
    }
};

const CITY_AVG = {
    Bengaluru: 1.8,
    Mumbai: 2.1,
    Delhi: 2.8,
    Chennai: 1.7,
    Hyderabad: 1.9,
    Kolkata: 2.0,
    Pune: 1.85,
    Ahmedabad: 2.2,
    Jaipur: 1.95,
    Surat: 2.05
};

function getCityAverage(city) {
    return CITY_AVG[city] || INDIA_AVG;
}

function calculateCreditScore(totalTonnes, globalAvg = INDIA_AVG) {
    return Math.round(Math.max(0, 850 - ((totalTonnes / globalAvg) * 425)));
}

function getScoreTier(score) {
    if (score <= 300) return { label: 'CARBON ROOKIE', className: 'score-red', color: '#ff4d4d' };
    if (score <= 500) return { label: 'ECO AWARE', className: 'score-orange', color: '#f39c12' };
    if (score <= 700) return { label: 'GREEN CHAMPION', className: 'score-yellowgreen', color: '#b9ff36' };
    return { label: 'CARBON HERO', className: 'score-brightgreen', color: '#39ff14' };
}

function calculateEquivalentFacts(totalTonnes) {
    const totalKgCO2 = totalTonnes * 1000;
    return {
        kmByCar: (totalKgCO2 / EF.petrol) * AVG_KM_PER_LITRE,
        treesNeeded: totalKgCO2 / TREE_OFFSET_KG,
        phoneCharges: totalKgCO2 / PHONE_CHARGE_CO2_KG,
        flightsMumbaiDelhi: totalKgCO2 / FLIGHT_CO2_KG
    };
}

function getCityTip(city, totalTonnes) {
    const tips = {
        Bengaluru: 'Bengaluru households usually get strong impact from efficient cooling and shorter commute swaps like metro + bus.',
        Mumbai: 'In Mumbai, rail-based commuting is a big lever. Reducing taxi or car dependence usually moves the needle fast.',
        Delhi: 'Delhi users often benefit most from cleaner transport choices and summer electricity efficiency.',
        Chennai: 'In Chennai, cooling demand matters a lot, so fans, efficient AC settings, and solar can pay off quickly.',
        Hyderabad: 'Hyderabad footprints often improve fastest through electricity efficiency and shorter private-vehicle trips.',
        Kolkata: 'Kolkata already has strong public transport options, so diet and home energy can become the next big win.',
        Pune: 'Pune users can usually gain fast by trimming petrol travel and improving apartment electricity efficiency.',
        Ahmedabad: 'Ahmedabad users often benefit from cooling efficiency and reducing high-temperature daytime car use.',
        Jaipur: 'Jaipur households can often lower emissions with efficient cooling, insulation habits, and smarter LPG use.',
        Surat: 'In Surat, efficient appliances and shifting frequent road trips can meaningfully lower annual emissions.'
    };
    const benchmark = getCityAverage(city);
    const compare = totalTonnes <= benchmark ? 'You are already beating your city benchmark.' : 'You are currently above your city benchmark.';
    return `${tips[city] || 'Your city benchmark helps anchor the next best improvements.'} ${compare}`;
}

function getHotspotInsight(breakdown) {
    const categories = [
        { key: 'electricity', label: 'Electricity', annual: breakdown.annualKg.electricity, savingsTip: (val) => `Switching to solar could save ${(val*0.8/1000).toFixed(1)} tonnes/yr` },
        { key: 'petrol', label: 'Petrol vehicle', annual: breakdown.annualKg.petrol, savingsTip: (val) => `Switching to an EV saves ${(val*0.5/1000).toFixed(1)} tonnes/yr` },
        { key: 'train', label: 'Train travel', annual: breakdown.annualKg.train, savingsTip: (val) => `Reducing trips could save ${(val*0.2/1000).toFixed(1)} tonnes/yr` },
        { key: 'lpg', label: 'LPG cooking', annual: breakdown.annualKg.lpg, savingsTip: (val) => `Switching to induction cooking saves ${(val*0.4/1000).toFixed(1)} tonnes/yr` },
        { key: 'diet', label: 'Diet', annual: breakdown.annualKg.diet, savingsTip: (val) => `Shifting to a plant-based diet saves ${(val*0.3/1000).toFixed(1)} tonnes/yr` }
    ];
    const top = categories.sort((a, b) => b.annual - a.annual)[0];
    const pct = breakdown.totalAnnualKg === 0 ? 0 : (top.annual / breakdown.totalAnnualKg) * 100;
    return `${top.label} is your biggest driver at ${top.annual.toFixed(1)} kg/year (${pct.toFixed(1)}% of your footprint). ${top.savingsTip(top.annual)}.`;
}

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getStorage(storage) {
    if (storage) return storage;
    if (typeof localStorage !== 'undefined') return localStorage;
    return null;
}

function getFootprintHistory(storage) {
    const safeStorage = getStorage(storage);
    if (!safeStorage) return [];

    try {
        const raw = safeStorage.getItem(HISTORY_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveFootprintHistory(entry, storage) {
    const safeStorage = getStorage(storage);
    if (!safeStorage) return [];

    const history = getFootprintHistory(safeStorage);
    const nextHistory = [...history, entry].slice(-MAX_HISTORY_ENTRIES);
    safeStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    return nextHistory;
}

function calculateBreakdown(inputs) {
    const stateEF = (inputs.state && inputs.state !== 'National' && EF.electricity[inputs.state]) ? EF.electricity[inputs.state] : EF.electricity.National;

    const monthlyKg = {
        electricity: inputs.electricity * stateEF,
        petrol: inputs.petrol * EF.petrol,
        train: inputs.train * EF.train,
        lpg: inputs.lpgCylinders * 14.2 * EF.lpg,
        diet: EF.diet[inputs.diet] || 0
    };
    const annualKg = {
        electricity: monthlyKg.electricity * 12,
        petrol: monthlyKg.petrol * 12,
        train: monthlyKg.train * 12,
        lpg: monthlyKg.lpg * 12,
        diet: monthlyKg.diet * 12
    };
    const totalAnnualKg = Object.values(annualKg).reduce((sum, value) => sum + value, 0);

    return {
        monthlyKg,
        annualKg,
        totalAnnualKg,
        totalTonnes: totalAnnualKg / 1000,
        scope1Tonnes: (annualKg.petrol + annualKg.lpg) / 1000,
        scope2Tonnes: annualKg.electricity / 1000,
        scope3Tonnes: (annualKg.train + annualKg.diet) / 1000
    };
}

function initGlobalCounter() {
    if (typeof document === 'undefined') return;
    const counterEl = document.getElementById('global-counter');
    if (!counterEl) return;

    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
    const tonnesPerSecond = 1173;

    function updateCounter() {
        const now = Date.now();
        const secondsPassed = (now - startOfYear) / 1000;
        const currentEmissions = Math.floor(secondsPassed * tonnesPerSecond);
        counterEl.innerText = currentEmissions.toLocaleString();
    }

    updateCounter();
    setInterval(updateCounter, 1000);
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        AVG_KM_PER_LITRE,
        CITY_AVG,
        EF,
        FLIGHT_CO2_KG,
        HISTORY_STORAGE_KEY,
        INDIA_AVG,
        MAX_HISTORY_ENTRIES,
        PHONE_CHARGE_CO2_KG,
        TREE_OFFSET_KG,
        calculateBreakdown,
        calculateCreditScore,
        calculateEquivalentFacts,
        getCityAverage,
        getCityTip,
        getFootprintHistory,
        getHotspotInsight,
        prefersReducedMotion,
        saveFootprintHistory
    };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initGlobalCounter();
        refreshIcons();

        const startBtn = document.getElementById('start-calc-btn');
        const heroSec = document.querySelector('.hero');
        const calcSec = document.getElementById('calculator-section');
        const dashSec = document.getElementById('dashboard-section');
        const form = document.getElementById('carbon-form');
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-toggle-icon');
        const shareScoreBtn = document.getElementById('share-score-btn');
        const downloadCardBtn = document.getElementById('download-card-btn');
        const editInputsBtn = document.getElementById('edit-inputs-btn');
        const exportHistoryBtn = document.getElementById('export-history-btn');
        const shareCanvas = document.getElementById('share-card-canvas');
        const steps = document.querySelectorAll('.calculator-step');
        const evSlider = document.getElementById('ev-slider');
        const solarSlider = document.getElementById('solar-slider');

        let currentStep = 0;
        let footprintChart = null;
        let leaderboardChart = null;
        let historyChart = null;
        let factsInterval = null;
        let latestCardUrl = '';
        let baseFootprint = {
            scope1: 0,
            scope2: 0,
            scope3: 0,
            total: 0,
            score: 0,
            city: 'Bengaluru',
            diet: 'omnivore',
            inputs: null,
            breakdown: null,
            history: []
        };

        applyStoredTheme();
        initializeKeyboardAccessibility();
        renderHistorySection(getFootprintHistory());
        loadSavedInputs();
        loadAchievements();
        window.baseFootprint = baseFootprint;

        // Progress Persistence Check
        checkReturnVisit();

        function checkReturnVisit() {
            try {
                const saved = getStorage()?.getItem('ecotrack_last_result');
                if (saved) {
                    const data = JSON.parse(saved);
                    const banner = document.getElementById('return-banner');
                    if (banner) {
                        banner.innerHTML = `👋 Welcome back! Your last score was <strong>${data.score}</strong> (${data.tier}) on ${data.date}. 
                            <button id="view-last-btn" class="btn" style="padding:4px 8px; font-size:0.8rem; margin: 0 10px;">View Last Results</button>
                            <button id="recalc-btn" class="btn secondary-btn" style="padding:4px 8px; font-size:0.8rem;">Recalculate</button>`;
                        banner.style.display = 'block';

                        document.getElementById('view-last-btn').addEventListener('click', () => {
                            banner.style.display = 'none';
                            baseFootprint.total = data.totalKg / 1000;
                            baseFootprint.score = data.score;
                            // Rehydrate enough data to show dashboard without running form
                            // Using last history entry as breakdown proxy if needed, or just let charts be empty
                            const hist = getFootprintHistory();
                            if (hist && hist.length > 0) {
                                const lastHist = hist[hist.length - 1];
                                baseFootprint = { ...baseFootprint, ...lastHist.fullData };
                            }
                            heroSec.style.display = 'none';
                            calcSec.style.display = 'none';
                            dashSec.style.display = 'block';
                            updateDashboard(baseFootprint);
                            dashSec.scrollIntoView({ behavior: 'smooth' });
                        });

                        document.getElementById('recalc-btn').addEventListener('click', () => {
                            banner.style.display = 'none';
                            heroSec.style.display = 'none';
                            calcSec.style.display = 'block';
                        });
                    }
                }
            } catch (e) { console.error('Persistence error:', e); }
        }

        function initGlobalCounter() {
            const counterEl = document.getElementById('live-counter');
            if (!counterEl) return;
            
            // Random start between 1847 and 2100
            let count = Math.floor(Math.random() * (2100 - 1847 + 1)) + 1847;
            counterEl.innerText = count.toLocaleString();

            function increment() {
                count++;
                counterEl.innerText = count.toLocaleString();
                // Brief yellow flash
                counterEl.style.color = '#ffe66d';
                setTimeout(() => {
                    counterEl.style.color = 'var(--text-color)';
                }, 400);

                // Next random interval between 8000 and 15000 ms
                const nextInterval = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
                setTimeout(increment, nextInterval);
            }
            
            const initialInterval = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
            setTimeout(increment, initialInterval);
        }

        startBtn.addEventListener('click', () => {
            heroSec.style.display = 'none';
            calcSec.style.display = 'block';
        });

        document.querySelectorAll('.next-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                steps[currentStep].classList.remove('active');
                currentStep += 1;
                steps[currentStep].classList.add('active');
            });
        });

        document.querySelectorAll('.prev-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                steps[currentStep].classList.remove('active');
                currentStep -= 1;
                steps[currentStep].classList.add('active');
            });
        });

        const dietSelect = document.getElementById('diet');
        if (dietSelect) {
            dietSelect.addEventListener('change', (e) => {
                if (e.target.value === 'omnivore') {
                    if (window.showToast) window.showToast('Nudge: Shifting to a vegetarian diet could save ~100kg CO2 per year!', 'leaf');
                } else if (e.target.value === 'vegan') {
                    if (window.showToast) window.showToast('Awesome! A vegan diet has the lowest carbon footprint.', 'heart');
                }
            });
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const inputs = {
                state: document.getElementById('state').value || 'National',
                electricity: parseFloat(document.getElementById('electricity').value) || 0,
                petrol: parseFloat(document.getElementById('petrol').value) || 0,
                train: parseFloat(document.getElementById('train').value) || 0,
                lpgCylinders: parseFloat(document.getElementById('lpg').value) || 0,
                diet: document.getElementById('diet').value,
                city: document.getElementById('city').value
            };

            const breakdown = calculateBreakdown(inputs);
            const score = calculateCreditScore(breakdown.totalTonnes);
            const historyEntry = {
                timestamp: new Date().toISOString(),
                total: Number(breakdown.totalTonnes.toFixed(2)),
                score,
                city: inputs.city
            };
            const history = saveFootprintHistory(historyEntry);

            baseFootprint = {
                scope1: breakdown.scope1Tonnes,
                scope2: breakdown.scope2Tonnes,
                scope3: breakdown.scope3Tonnes,
                total: breakdown.totalTonnes,
                score,
                city: inputs.city,
                diet: inputs.diet,
                inputs,
                breakdown,
                history,
                fullData: { scope1: breakdown.annualKg.petrol/1000 + breakdown.annualKg.lpg/1000, scope2: breakdown.annualKg.electricity/1000, scope3: breakdown.annualKg.train/1000 + breakdown.annualKg.diet/1000, breakdown }
            };
            
            getStorage()?.setItem('ecotrack-inputs', JSON.stringify(inputs));
            window.baseFootprint = baseFootprint;

            const calcBtn = document.querySelector('#carbon-form button[type="submit"]');
            const originalBtnHtml = calcBtn ? calcBtn.innerHTML : 'Calculate Carbon Footprint';
            if (calcBtn) {
                calcBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Fetching AI Insights...';
                refreshIcons();
            }

            // Simulating API Placeholder as per Hackathon Requirements
            setTimeout(() => {
                calcSec.style.display = 'none';
                dashSec.style.display = 'block';
                updateDashboard(baseFootprint);
                checkAchievements();
                
                // Save Progress Persistence
                const tier = getScoreTier(baseFootprint.score);
                getStorage()?.setItem('ecotrack_last_result', JSON.stringify({
                    score: baseFootprint.score,
                    tier: tier.label,
                    totalKg: baseFootprint.total * 1000,
                    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                }));
                
                if (calcBtn) {
                    calcBtn.innerHTML = originalBtnHtml;
                    refreshIcons();
                }

                // Trigger onboarding tour if first time
                setTimeout(() => {
                    initOnboardingTour();
                }, 1000);

            }, 800);
        });

        themeToggle.addEventListener('click', toggleTheme);
        shareScoreBtn.addEventListener('click', () => {
            if (baseFootprint.total > 0) {
                generateShareCard(baseFootprint);
            }
        });
        downloadCardBtn.addEventListener('click', downloadShareCard);
        exportHistoryBtn.addEventListener('click', exportHistoryCsv);
        editInputsBtn.addEventListener('click', editPreviousInputs);
        document.querySelectorAll('.chart-download-btn').forEach((btn) => {
            btn.addEventListener('click', () => downloadChartImage(btn.dataset.chart));
        });

        [evSlider, solarSlider].forEach((slider) => {
            slider.addEventListener('input', () => {
                const evPct = parseInt(evSlider.value, 10) / 100;
                const solarPct = parseInt(solarSlider.value, 10) / 100;

                document.getElementById('ev-val').innerText = `${evSlider.value}%`;
                document.getElementById('solar-val').innerText = `${solarSlider.value}%`;

                const petrolPortion = (baseFootprint.breakdown?.annualKg.petrol || 0) / 1000;
                const elecPortion = (baseFootprint.breakdown?.annualKg.electricity || 0) / 1000;
                const evSavings = petrolPortion * evPct * 0.5;
                const solarSavings = elecPortion * solarPct;
                const newTotal = Math.max(0, baseFootprint.total - evSavings - solarSavings);

                document.getElementById('projected-total').innerText = newTotal.toFixed(2);
            });
        });

        function applyStoredTheme() {
            const storedTheme = getStorage()?.getItem(THEME_STORAGE_KEY) || 'dark';
            const isLight = storedTheme === 'light';
            document.body.classList.toggle('light-mode', isLight);
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) {
                themeBtn.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}" id="theme-toggle-icon"></i>`;
                refreshIcons();
            }
        }

        function toggleTheme() {
            const isLightMode = document.body.classList.toggle('light-mode');
            const nextTheme = isLightMode ? 'light' : 'dark';
            getStorage()?.setItem(THEME_STORAGE_KEY, nextTheme);
            const themeBtn = document.getElementById('theme-toggle');
            if (themeBtn) {
                themeBtn.innerHTML = `<i data-lucide="${isLightMode ? 'moon' : 'sun'}" id="theme-toggle-icon"></i>`;
                refreshIcons();
            }
            if (baseFootprint.total > 0) {
                updateDashboard(baseFootprint);
            } else {
                renderHistorySection(getFootprintHistory());
            }
        }

        function editPreviousInputs() {
            if (!baseFootprint.inputs) return;
            if (document.getElementById('state')) document.getElementById('state').value = baseFootprint.inputs.state || 'National';
            document.getElementById('electricity').value = baseFootprint.inputs.electricity;
            document.getElementById('petrol').value = baseFootprint.inputs.petrol;
            document.getElementById('train').value = baseFootprint.inputs.train;
            document.getElementById('lpg').value = baseFootprint.inputs.lpgCylinders;
            document.getElementById('diet').value = baseFootprint.inputs.diet;
            document.getElementById('city').value = baseFootprint.inputs.city;
            dashSec.style.display = 'none';
            calcSec.style.display = 'block';
            steps.forEach((step) => step.classList.remove('active'));
            currentStep = 0;
            steps[currentStep].classList.add('active');
            document.getElementById('calculator-section').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }

        function initializeKeyboardAccessibility() {
            document.querySelectorAll('.challenge-badge').forEach((badge, index) => {
                badge.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        window.toggleChallenge(badge, index + 1);
                    }
                });
            });

            const aiHeader = document.querySelector('.ai-header');
            aiHeader.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    window.toggleAIChat();
                }
            });
        }

        function animateScore(scoreEl, finalScore, duration = 2000) {
            if (prefersReducedMotion()) {
                scoreEl.innerText = String(finalScore);
                return;
            }
            const startTime = performance.now();
            scoreEl.innerText = '0';

            function step(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                scoreEl.innerText = Math.round(finalScore * progress);
                if (progress < 1) requestAnimationFrame(step);
            }

            requestAnimationFrame(step);
        }

        function updateDashboard(data) {
            updateCreditScore(data.score);
            updateEquivalentFacts(data.total);
            updateComparisonMessage(data.total, data.city);
            updateBreakdownTable(data.breakdown);
            updateInsightCards(data);
            renderFootprintChart(data);
            renderLeaderboardChart(data);
            renderHistorySection(data.history);
            updateTimeline(data.total);

            document.getElementById('total-co2').innerText = data.total.toFixed(2);
            document.getElementById('projected-total').innerText = data.total.toFixed(2);
            downloadCardBtn.disabled = true;
            
            const shareLinks = document.getElementById('social-share-links');
            if (shareLinks) shareLinks.style.display = 'none';

            // Auto-generate card on calculate
            if (data && data.total > 0) {
                generateShareCard(data);
            }

            if (latestCardUrl) {
                URL.revokeObjectURL(latestCardUrl);
                latestCardUrl = '';
            }
            refreshIcons();
        }

        function updateCreditScore(scoreVal) {
            const scoreEl = document.getElementById('credit-score-val');
            const scoreLbl = document.getElementById('credit-score-label');
            const scoreGaugeFill = document.getElementById('credit-gauge-svg');
            const scoreTier = getScoreTier(scoreVal);

            scoreEl.className = `credit-score ${scoreTier.className}`;
            scoreLbl.className = `credit-label ${scoreTier.className}`;
            scoreLbl.innerText = scoreTier.label;
            
            if (scoreGaugeFill) {
                const offset = 210 - (scoreVal / 850) * 210;
                scoreGaugeFill.style.strokeDashoffset = offset;
                scoreGaugeFill.style.stroke = getComputedStyle(scoreEl).color;
            }
            animateScore(scoreEl, scoreVal);
        }

        function updateEquivalentFacts(totalTonnes) {
            const factText = document.getElementById('equivalent-fact-text');
            const facts = calculateEquivalentFacts(totalTonnes);
            const items = [
                `Your footprint = driving ${Math.round(facts.kmByCar).toLocaleString()} km by car`,
                `Your footprint = ${Math.round(facts.treesNeeded).toLocaleString()} trees needed to offset it`,
                `Your footprint = charging your phone ${Math.round(facts.phoneCharges).toLocaleString()} times`,
                `Your footprint = ${facts.flightsMumbaiDelhi.toFixed(1)} flights Mumbai to Delhi`
            ];
            let index = 0;

            if (factsInterval) clearInterval(factsInterval);
            if (prefersReducedMotion()) {
                factText.innerText = items[0];
                factText.classList.add('visible');
                return;
            }

            const showFact = () => {
                factText.classList.remove('visible');
                setTimeout(() => {
                    factText.innerText = items[index];
                    factText.classList.add('visible');
                    index = (index + 1) % items.length;
                }, 180);
            };

            showFact();
            factsInterval = setInterval(showFact, 3000);
        }

        function updateComparisonMessage(totalTonnes, city) {
            const compEl = document.getElementById('comparison-result');
            const cityAvg = getCityAverage(city);

            if (totalTonnes < INDIA_AVG) {
                compEl.innerHTML = `Excellent! You are <span style="color:var(--accent-color)">${(((INDIA_AVG - totalTonnes) / INDIA_AVG) * 100).toFixed(0)}% better</span> than the Indian average and below ${city}'s ${cityAvg.toFixed(2)}t benchmark.`;
            } else {
                compEl.innerHTML = `Your footprint is <span style="color:#ff6b6b">${(((totalTonnes - INDIA_AVG) / INDIA_AVG) * 100).toFixed(0)}% higher</span> than the Indian average and above ${city}'s ${cityAvg.toFixed(2)}t benchmark.`;
            }
        }

        function updateInsightCards(data) {
            document.getElementById('city-insights').innerText = getCityTip(data.city, data.total);
            document.getElementById('hotspot-insight').innerText = getHotspotInsight(data.breakdown);
        }

        function renderFootprintChart(data) {
            const ctx = document.getElementById('footprintChart').getContext('2d');
            if (footprintChart) footprintChart.destroy();

            footprintChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Scope 1 (Direct)', 'Scope 2 (Energy)', 'Scope 3 (Indirect)'],
                    datasets: [{
                        data: [data.scope1, data.scope2, data.scope3],
                        backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: getThemeVar('--chart-label-color', '#ffffff') }
                        }
                    }
                }
            });
        }

        function renderLeaderboardChart(data) {
            const lctx = document.getElementById('leaderboardChart').getContext('2d');
            if (leaderboardChart) leaderboardChart.destroy();

            const valueLabelPlugin = {
                id: 'valueLabelPlugin',
                afterDatasetsDraw(chart) {
                    const { ctx } = chart;
                    const meta = chart.getDatasetMeta(0);
                    ctx.save();
                    ctx.fillStyle = getThemeVar('--chart-label-color', '#ffffff');
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    meta.data.forEach((bar, index) => {
                        const value = chart.data.datasets[0].data[index];
                        ctx.fillText(Number(value).toFixed(2), bar.x, bar.y - 6);
                    });
                    ctx.restore();
                }
            };

            leaderboardChart = new Chart(lctx, {
                type: 'bar',
                data: {
                    labels: ['You', 'Your City', 'India Avg'],
                    datasets: [{
                        label: 'Tonnes CO2/Year',
                        data: [data.total, getCityAverage(data.city), INDIA_AVG],
                        backgroundColor: ['#39ff14', '#ffe66d', '#ff4d4f'],
                        borderWidth: 0,
                        borderRadius: 4,
                        maxBarThickness: 72
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: getThemeVar('--grid-color', '#333333') },
                            ticks: { color: getThemeVar('--chart-label-color', '#ffffff') }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: getThemeVar('--chart-label-color', '#ffffff') }
                        }
                    }
                },
                plugins: [valueLabelPlugin]
            });
        }

        function renderHistorySection(history) {
            const trendEl = document.getElementById('history-trend');
            const ctx = document.getElementById('historyChart').getContext('2d');
            const labels = history.map((entry) => new Date(entry.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
            const values = history.map((entry) => entry.total);

            if (historyChart) historyChart.destroy();

            historyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Tonnes CO2/Year',
                        data: values,
                        borderColor: '#39ff14',
                        backgroundColor: 'rgba(57, 255, 20, 0.12)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointBackgroundColor: '#39ff14'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: getThemeVar('--grid-color', '#333333') },
                            ticks: { color: getThemeVar('--chart-label-color', '#ffffff') }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: getThemeVar('--chart-label-color', '#ffffff') }
                        }
                    }
                }
            });

            if (history.length < 2) {
                trendEl.innerText = 'Complete one more calculation to unlock your improvement trend.';
                trendEl.className = 'history-trend neutral';
                return;
            }

            const latest = history[history.length - 1].total;
            const previous = history[history.length - 2].total;
            const changePct = previous === 0 ? 0 : Math.abs(((latest - previous) / previous) * 100);

            if (latest < previous) {
                trendEl.innerText = `↓ Your footprint dropped ${changePct.toFixed(0)}% since last time! 🎉`;
                trendEl.className = 'history-trend down';
            } else if (latest > previous) {
                trendEl.innerText = `↑ Your footprint increased ${changePct.toFixed(0)}% since last time.`;
                trendEl.className = 'history-trend up';
            } else {
                trendEl.innerText = '→ Your footprint stayed the same since last time.';
                trendEl.className = 'history-trend neutral';
            }
        }

        function updateTimeline(totalTonnes) {
            const targetRate = 1.5;
            const maxRateOnScale = Math.max(targetRate * 2, totalTonnes * 1.2, 2);
            const fillEl = document.getElementById('timeline-fill');
            const userMarker = document.getElementById('user-marker');
            const valEl = document.getElementById('timeline-user-val');
            const msgEl = document.getElementById('timeline-msg');
            const targetPct = (targetRate / maxRateOnScale) * 100;

            document.querySelector('.target-marker').style.left = `${targetPct}%`;

            if (prefersReducedMotion()) {
                const userPct = (totalTonnes / maxRateOnScale) * 100;
                fillEl.style.width = `${userPct}%`;
                userMarker.style.left = `${userPct}%`;
                valEl.innerText = totalTonnes.toFixed(1);
                if (totalTonnes > targetRate) {
                    fillEl.classList.add('danger');
                    userMarker.classList.add('danger');
                    msgEl.innerHTML = `At your current rate, your 2030 trajectory <span style="color:#ff4757">misses</span> the Paris Agreement 1.5t target.`;
                } else {
                    fillEl.classList.remove('danger');
                    userMarker.classList.remove('danger');
                    msgEl.innerHTML = `Excellent! You are <span style="color:#2ed573">on track</span> to meet the 2030 Paris Agreement target.`;
                }
                return;
            }

            setTimeout(() => {
                const userPct = (totalTonnes / maxRateOnScale) * 100;
                fillEl.style.width = `${userPct}%`;
                userMarker.style.left = `${userPct}%`;
                valEl.innerText = totalTonnes.toFixed(1);

                if (totalTonnes > targetRate) {
                    fillEl.classList.add('danger');
                    userMarker.classList.add('danger');
                    msgEl.innerHTML = `At your current rate, your 2030 trajectory <span style="color:#ff4757">misses</span> the Paris Agreement 1.5t target.`;
                } else {
                    fillEl.classList.remove('danger');
                    userMarker.classList.remove('danger');
                    msgEl.innerHTML = `Excellent! You are <span style="color:#2ed573">on track</span> to meet the 2030 Paris Agreement target.`;
                }
            }, 250);
        }

        function updateBreakdownTable(breakdown) {
            const tbody = document.getElementById('breakdown-table-body');
            const total = breakdown.totalAnnualKg || 1;
            const rows = [
                { label: 'Electricity (Scope 2)', monthly: breakdown.monthlyKg.electricity, annual: breakdown.annualKg.electricity },
                { label: 'Petrol Vehicle (Scope 1)', monthly: breakdown.monthlyKg.petrol, annual: breakdown.annualKg.petrol },
                { label: 'Train Travel (Scope 3)', monthly: breakdown.monthlyKg.train, annual: breakdown.annualKg.train },
                { label: 'LPG Cooking (Scope 1)', monthly: breakdown.monthlyKg.lpg, annual: breakdown.annualKg.lpg },
                { label: 'Diet (Scope 3)', monthly: breakdown.monthlyKg.diet, annual: breakdown.annualKg.diet }
            ];
            const totalMonthly = Object.values(breakdown.monthlyKg).reduce((sum, value) => sum + value, 0);

            tbody.innerHTML = rows.map((row) => {
                const pct = (row.annual / total) * 100;
                const rowClass = pct > 30 ? 'table-high' : pct >= 15 ? 'table-mid' : 'table-low';
                return `<tr class="${rowClass}"><th scope="row">${row.label}</th><td>${row.monthly.toFixed(1)}</td><td>${row.annual.toFixed(1)}</td><td>${pct.toFixed(1)}%</td></tr>`;
            }).join('') + `<tr class="table-total"><th scope="row">TOTAL</th><td>${totalMonthly.toFixed(1)}</td><td>${breakdown.totalAnnualKg.toFixed(1)}</td><td>100%</td></tr>`;
        }

        function generateShareCard(data) {
            const ctx = shareCanvas.getContext('2d');
            const width = shareCanvas.width;
            const height = shareCanvas.height;
            const tier = getScoreTier(data.score);

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#081208';
            ctx.fillRect(0, 0, width, height);

            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#0d1f0d');
            gradient.addColorStop(1, '#183718');
            ctx.fillStyle = gradient;
            ctx.fillRect(70, 70, width - 140, height - 140);

            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 6;
            ctx.strokeRect(70, 70, width - 140, height - 140);

            ctx.save();
            ctx.translate(width - 220, 240);
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = '#7fff6b';
            ctx.beginPath();
            ctx.ellipse(0, 0, 90, 48, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.rotate(-Math.PI / 6);
            ctx.beginPath();
            ctx.ellipse(-55, 0, 65, 32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#e8ffe3';
            ctx.font = '600 42px Inter';
            ctx.fillText('EcoTrack India Carbon Card', 130, 180);

            ctx.fillStyle = '#39ff14';
            ctx.font = '900 200px Inter';
            ctx.fillText(String(data.score), 120, 430);

            ctx.fillStyle = '#d0fbd0';
            ctx.font = '700 56px Inter';
            ctx.fillText(tier.label, 130, 520);

            ctx.fillStyle = '#0c180c';
            ctx.fillRect(130, 580, 820, 240);
            ctx.strokeStyle = '#2ed573';
            ctx.lineWidth = 2;
            ctx.strokeRect(130, 580, 820, 240);

            ctx.fillStyle = '#e8ffe3';
            ctx.font = '500 44px Inter';
            ctx.fillText(`Your footprint: ${data.total.toFixed(2)} tonnes / year`, 170, 660);
            ctx.fillText(`India average: ${INDIA_AVG.toFixed(1)} tonnes / year`, 170, 735);
            ctx.fillText(`City benchmark: ${data.city} ${getCityAverage(data.city).toFixed(2)} tonnes`, 170, 810);

            ctx.fillStyle = '#b9ff36';
            ctx.font = '500 36px Inter';
            ctx.fillText('Calculated on EcoTrack India', 130, 940);
            ctx.fillText(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 130, 995);

            // Draw Custom QR Code Placeholder
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;
            ctx.beginPath();
            ctx.roundRect(750, 870, 150, 150, 12);
            ctx.fill();
            ctx.shadowColor = 'transparent'; // turn off shadow
            
            // Draw mock QR pattern inside the box
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(770, 890, 30, 30); // Top-left square
            ctx.fillRect(850, 890, 30, 30); // Top-right square
            ctx.fillRect(770, 970, 30, 30); // Bottom-left square
            ctx.fillRect(815, 935, 40, 40); // Middle cluster
            ctx.fillRect(860, 980, 20, 20); // Bottom-right corner
            ctx.fillRect(780, 945, 15, 15); // Random dot
            ctx.fillRect(820, 905, 15, 15); // Random dot
            ctx.fillRect(860, 945, 15, 15); // Random dot

            ctx.fillStyle = '#b9ff36';
            ctx.font = '500 24px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Scan to calculate', 825, 1055);
            ctx.restore();

            downloadCardBtn.disabled = false;
            const shareLinks = document.getElementById('social-share-links');
            if (shareLinks) shareLinks.style.display = 'flex';
            
            // Re-render icons on the page just in case
            refreshIcons();
        }

        function downloadShareCard() {
            shareCanvas.toBlob((blob) => {
                if (!blob) return;
                if (latestCardUrl) URL.revokeObjectURL(latestCardUrl);
                latestCardUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = latestCardUrl;
                link.download = 'eco-score.png';
                link.click();
            });
        }

        function downloadChartImage(chartId) {
            const canvas = document.getElementById(chartId);
            if (!canvas) return;
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${chartId}.png`;
            link.click();
        }

        function exportHistoryCsv() {
            const history = baseFootprint.history?.length ? baseFootprint.history : getFootprintHistory();
            if (!history.length) return;
            const lines = [
                'timestamp,total_tonnes,score,city',
                ...history.map((entry) => `${entry.timestamp},${entry.total},${entry.score},${entry.city}`)
            ];
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'ecotrack-history.csv';
            link.click();
            URL.revokeObjectURL(url);
        }

        function getThemeVar(name, fallback) {
            return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
        }
    });
}

 // --- Weekly Challenges ---
let activeChallenges = 0;
if (typeof window !== 'undefined') {
window.toggleChallenge = function(element, id) {
    if (element.classList.contains('accepted')) {
        element.classList.remove('accepted');
        element.setAttribute('aria-pressed', 'false');
        activeChallenges--;
    } else {
        element.classList.add('accepted');
        element.setAttribute('aria-pressed', 'true');
        activeChallenges++;
    }
    document.getElementById('challenges-count').innerText = `${activeChallenges}/3`;
};    

    let chatOpen = false;
    window.toggleAIChat = function() {
        chatOpen = !chatOpen;
        document.getElementById('ai-body').style.display = chatOpen ? 'flex' : 'none';
        document.getElementById('ai-toggle-icon').innerText = chatOpen ? 'v' : '^';
    };

    window.sendAIMessage = function() {
        const inputEl = document.getElementById('ai-user-input');
        const msg = inputEl.value.trim();
        if (!msg) return;

        appendChatMsg(msg, 'user');
        inputEl.value = '';

        const chatWindow = document.getElementById('ai-chat-window');
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatWindow.appendChild(indicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        const delay = Math.floor(Math.random() * 1500) + 1500;
        setTimeout(() => {
            const fp = window.baseFootprint || { scope1: 0, scope2: 0, scope3: 0, total: 0, city: 'Unknown' };
            const reply = getRuleBasedResponse(msg.toLowerCase(), fp);
            document.getElementById('typing-indicator').remove();
            appendChatMsg(reply, 'bot');
        }, delay);
    };

    function getRuleBasedResponse(msg, fp) {
        const isCalculated = fp.total > 0;
        
        if (msg.match(/hi|hello|hey|greetings/)) {
            if (isCalculated) {
                return `Hello! I'm your AI Carbon Coach. I see you live in ${fp.city} and generate ${fp.total.toFixed(2)} tonnes of CO2 per year. How can I help you shrink that today?`;
            }
            return "Hello! I'm your personalized AI Carbon Coach. How can I assist you with your carbon footprint today?";
        }
        
        if (!isCalculated && msg.match(/reduce|score|footprint|my data|tips/)) return 'Please complete the calculator on the main screen first! I need your data to give you personalized advice.';

        if (msg.match(/reduce.*score|improve.*score|lower.*footprint|tips|give me personalized tips/)) {
            let highest = 'Scope 1 (Direct Fuel)';
            let value = fp.scope1;
            if (fp.scope2 > value) { highest = 'Scope 2 (Electricity)'; value = fp.scope2; }
            if (fp.scope3 > value) { highest = 'Scope 3 (Indirect/Diet)'; value = fp.scope3; }

            let advice = `Based on your specific data, your biggest emission source is ${highest} at ${value.toFixed(2)} tonnes.\n\n`;
            
            if (highest.includes('Scope 1')) {
                advice += `Top 3 Personalized Tips:\n1. Your petrol use is ${(fp.inputs.petrol)} L/month. Replacing just 25% of your driving with public transit saves ${((fp.inputs.petrol * 12 * 0.25 * EF.petrol) / 1000).toFixed(2)} tonnes annually.\n2. Ensure your tire pressure is optimal; it improves mileage by 3%.\n3. Consider switching to an EV for your next vehicle.`;
            } else if (highest.includes('Scope 2')) {
                const sEF = (fp.inputs.state && EF.electricity[fp.inputs.state]) ? EF.electricity[fp.inputs.state] : EF.electricity.National;
                advice += `Top 3 Personalized Tips:\n1. You live in ${fp.city} where the grid emission factor is ${sEF}. Cutting AC use by just 2 hours a day could save you ${((50 * 12 * sEF) / 1000).toFixed(2)} tonnes annually!\n2. Switch all remaining bulbs to LED.\n3. Unplug appliances when not in use to stop "vampire" energy drain.`;
            } else {
                advice += `Top 3 Personalized Tips:\n1. Your train/flight/diet choices are driving your Scope 3. Since you are a ${fp.inputs.diet}, shifting just 2 meals a week to plant-based could save significant emissions.\n2. Buy local produce to reduce transportation footprints.\n3. Start composting organic waste.`;
            }
            return advice;
        }

        if (msg.match(/average|compare|better|worse/)) {
            const diff = (((fp.total - INDIA_AVG) / INDIA_AVG) * 100).toFixed(0);
            if (fp.total < INDIA_AVG) return `Yes! You are at ${fp.total.toFixed(2)} tonnes, which is ${Math.abs(diff)}% better than the Indian average of 1.9 tonnes.`;
            return `Currently, you are at ${fp.total.toFixed(2)} tonnes, which is ${diff}% higher than the Indian average of 1.9 tonnes.`;
        }

        if (msg.match(/what is scope 1|scope 1/)) return 'Scope 1 covers direct emissions like petrol in your car or LPG used for cooking.';
        if (msg.match(/what is scope 2|scope 2/)) return 'Scope 2 covers indirect emissions from purchased electricity.';
        if (msg.match(/what is scope 3|scope 3/)) return 'Scope 3 covers other indirect emissions like food and public transport.';
        
        return 'Every small action counts: turn off lights, unplug devices, and walk short distances instead of driving.';
    }

    function appendChatMsg(text, sender) {
        const chatWindow = document.getElementById('ai-chat-window');
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-msg ${sender}`;
        msgDiv.innerText = text;
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // --- Persistence ---
    function loadSavedInputs() {
        try {
            const saved = getStorage()?.getItem('ecotrack-inputs');
            if (saved) {
                const inputs = JSON.parse(saved);
                if (document.getElementById('state')) document.getElementById('state').value = inputs.state || 'National';
                document.getElementById('electricity').value = inputs.electricity || 0;
                document.getElementById('petrol').value = inputs.petrol || 0;
                document.getElementById('train').value = inputs.train || 0;
                document.getElementById('lpg').value = inputs.lpgCylinders || 0;
                document.getElementById('diet').value = inputs.diet || 'omnivore';
                document.getElementById('city').value = inputs.city || 'Bengaluru';
            }
        } catch(e) {}
    }

    // --- Onboarding Tour ---
    function initOnboardingTour() {
        if (getStorage()?.getItem('ecotrack_tour_done')) return;
        
        const overlay = document.getElementById('tour-overlay');
        const tooltip = document.getElementById('tour-tooltip');
        const text = document.getElementById('tour-text');
        const nextBtn = document.getElementById('tour-next-btn');
        if (!overlay || !tooltip) return;

        let step = 1;
        const steps = [
            { el: document.querySelector('.gauge-container'), msg: "Your AI-calculated Carbon Credit Score. Aim for 600+!" },
            { el: document.getElementById('equivalent-facts'), msg: "See your footprint in real-world terms 🌍" },
            { el: document.querySelector('.scope-labels').parentNode, msg: "Understand WHERE your emissions come from" },
            { el: document.getElementById('leaderboardChart').parentNode.parentNode, msg: "Compare yourself against 8 Indian cities" },
            { el: document.querySelector('.share-actions'), msg: "Challenge friends and unlock the Influencer badge!" }
        ];

        let currentHighlight = null;

        function showStep(index) {
            if (currentHighlight) {
                currentHighlight.classList.remove('tour-highlight');
            }
            if (index >= steps.length) {
                // End tour
                overlay.classList.remove('active');
                tooltip.classList.remove('active');
                getStorage()?.setItem('ecotrack_tour_done', 'true');
                return;
            }

            const target = steps[index].el;
            if (!target) {
                showStep(index + 1);
                return;
            }

            target.classList.add('tour-highlight');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            currentHighlight = target;

            text.innerText = steps[index].msg;
            
            setTimeout(() => {
                const rect = target.getBoundingClientRect();
                tooltip.style.top = `${window.scrollY + rect.bottom + 20}px`;
                tooltip.style.left = `50%`;
                tooltip.style.transform = `translateX(-50%)`;
                
                if (index === steps.length - 1) {
                    nextBtn.innerText = "Got it!";
                }
                
                overlay.classList.add('active');
                tooltip.classList.add('active');
            }, 500);
        }

        nextBtn.addEventListener('click', () => {
            step++;
            showStep(step - 1);
        });

        // Start
        showStep(0);
    }

    // --- Gamification ---
    let unlockedBadges = [];

    function loadAchievements() {
        try {
            const saved = getStorage()?.getItem('ecotrack-achievements');
            if (saved) {
                unlockedBadges = JSON.parse(saved);
                unlockedBadges.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.classList.remove('locked');
                        el.classList.add('unlocked');
                    }
                });
            }
        } catch(e) {}
    }

    function unlockBadge(id, title) {
        if (!unlockedBadges.includes(id)) {
            unlockedBadges.push(id);
            getStorage()?.setItem('ecotrack-achievements', JSON.stringify(unlockedBadges));
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('locked');
                el.classList.add('unlocked');
            }
            showToast(`Achievement Unlocked: ${title}!`, 'award');
        }
    }

    window.checkAchievements = function() {
        const fp = window.baseFootprint;
        if (!fp || fp.total === 0) return;
        
        if (fp.score > 600) {
            unlockBadge('badge-eco-hero', 'Eco Hero (>600 Score)');
        }
        if (fp.inputs && fp.inputs.state && fp.inputs.state !== 'National') {
            unlockBadge('badge-state-expert', 'State Grid Expert');
        }
    };

    window.showToast = function(message, iconName = 'bell') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons({root: toast});
        
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3600);
    };

    window.addDailyLog = function() {
        const typeEl = document.getElementById('daily-type');
        const valEl = document.getElementById('daily-val');
        const val = parseFloat(valEl.value);
        if (!val || val <= 0) return;

        let addedKg = 0;
        if (typeEl.value === 'train') addedKg = val * EF.train;
        if (typeEl.value === 'petrol') addedKg = val * EF.petrol;
        if (typeEl.value === 'electricity') {
            const sEF = (window.baseFootprint && window.baseFootprint.inputs && window.baseFootprint.inputs.state && EF.electricity[window.baseFootprint.inputs.state]) 
                ? EF.electricity[window.baseFootprint.inputs.state] 
                : EF.electricity.National;
            addedKg = val * sEF;
        }

        const addedTonnes = addedKg / 1000;
        
        if (window.baseFootprint && window.baseFootprint.total > 0) {
            window.baseFootprint.total += addedTonnes;
            if (typeEl.value === 'electricity') window.baseFootprint.scope2 += addedTonnes;
            if (typeEl.value === 'petrol') window.baseFootprint.scope1 += addedTonnes;
            if (typeEl.value === 'train') window.baseFootprint.scope3 += addedTonnes;
            
            window.baseFootprint.score = window.calculateCreditScore(window.baseFootprint.total);
            
            valEl.value = '';
            
            // Just update UI rapidly
            document.getElementById('total-co2').innerText = window.baseFootprint.total.toFixed(2);
            document.getElementById('projected-total').innerText = window.baseFootprint.total.toFixed(2);
            document.getElementById('credit-score-val').innerText = window.baseFootprint.score;
            
            // Trigger animation and colors
            const scoreEl = document.getElementById('credit-score-val');
            const scoreLbl = document.getElementById('credit-score-label');
            const scoreGaugeFill = document.getElementById('credit-gauge-svg');
            const scoreTier = getScoreTier(window.baseFootprint.score);

            scoreEl.className = `credit-score ${scoreTier.className}`;
            scoreLbl.className = `credit-label ${scoreTier.className}`;
            scoreLbl.innerText = scoreTier.label;
            
            if (scoreGaugeFill) {
                const offset = 210 - (window.baseFootprint.score / 850) * 210;
                scoreGaugeFill.style.strokeDashoffset = offset;
                scoreGaugeFill.style.stroke = getComputedStyle(scoreEl).color;
            }

            unlockBadge('badge-first-log', 'First Log');
            window.checkAchievements();
            window.showToast(`Logged ${val} ${typeEl.value}. Added ${addedKg.toFixed(2)} kg CO2 to footprint.`, 'check-circle');
        } else {
            alert('Please calculate your base footprint first!');
        }
    };

    window.shareToWhatsApp = function() {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`I just checked my Carbon Credit Score on EcoTrack India! I scored ${window.baseFootprint.score} / 850. Check yours out here: `);
        window.open(`https://wa.me/?text=${text}${url}`, '_blank');
    };

    window.shareToTwitter = function() {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`I just scored ${window.baseFootprint.score}/850 on the EcoTrack India Carbon Calculator! 🌱 Can you beat my score? `);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };
}
