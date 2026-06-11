# EcoTrack India: Gamified Carbon Intelligence Platform

**EcoTrack India** is a highly interactive Progressive Web App (PWA) designed to calculate, analyze, and gamify personal carbon footprints for Indian citizens. 

Live URL: [https://manojs923.github.io/Carbon-Footprint-Awareness-Platform/](https://manojs923.github.io/Carbon-Footprint-Awareness-Platform/)

---

## 🎯 Chosen Vertical
**Persona:** Eco-Awareness & Carbon Footprint Tracking

We chose this vertical to shift the narrative from climate anxiety to actionable, data-driven habits. Standard carbon calculators are often tedious and provide generic advice. EcoTrack India solves this by gamifying the experience and leveraging dynamic AI for localized context.

---

## 🚀 Approach and Logic
Our approach focused on zero-dependency, lightning-fast architecture. The platform was built entirely with HTML, CSS (Glassmorphism), and Vanilla JavaScript to ensure maximum efficiency.

### Logic Flow:
1. **Data Collection:** Collects user inputs across Transport (Scope 1/3), Home Energy (Scope 2), and Diet/Waste (Scope 3).
2. **Algorithm Processing:** Applies localized Indian emission factors. For example, electricity calculation inherently depends on the chosen State, acknowledging that coal-heavy states have a different grid emission factor than high-renewable states.
3. **Scoring:** The total footprint (in tonnes) is mathematically inverted and scaled to generate a "Carbon Credit Score" (0-850), mimicking a financial credit score.
4. **Insights:** AI logic maps the highest emission category (e.g., Petrol) to an array of specific, personalized mitigation strategies.

---

## ⚙️ How the Solution Works
1. **Progressive Web App (PWA):** Users can install the app to their home screens. A Service Worker (`sw.js`) caches all assets for instant offline loading.
2. **First-Visit Onboarding:** A custom JS engine triggers a 5-step tour that darkens the screen and highlights critical UI components (Score, Equivalents, Charts, Benchmarks, Share) for new users.
3. **Dynamic AI Carbon Coach:** Users interact with a floating chat bubble. Clicking "Get Personalized Tips" analyzes their exact breakdown and outputs 3 highly specific strategies based on their worst-performing category.
4. **Gamification:** Features a live social proof counter, unlockable achievement badges, and interactive sliders to simulate switching to EVs or Solar.
5. **Progress Persistence:** Calculates are saved to `localStorage`. Returning users are greeted with a dismissible banner showing their last score and allowing them to instantly view their past dashboard.
6. **Canvas Share Card:** Users can download a premium, Apple-Wallet style Carbon Card generated purely via the HTML5 Canvas API, complete with a custom QR code placeholder for social sharing.

---

## 🤔 Assumptions Made
1. **Emission Factors:** We assumed standardized average emission factors for India (e.g., Petrol = 0.21 kg CO2/km, average grid factor = ~0.71 kg CO2/kWh) and utilized approximations for the State-level grid factors.
2. **Average Benchmarks:** The India national average is assumed to be 1.9 tonnes per capita, based on recent global averages. City benchmarks (e.g., Bengaluru, Mumbai) are estimated relative baselines for the sake of the leaderboard chart logic.
3. **Local Storage:** We assume the user is accessing the app from a personal device where `localStorage` is enabled, allowing us to persist their data securely without a backend database.
4. **PWA Support:** We assume the user is running a modern browser (Chrome, Safari, Edge) capable of supporting Service Workers and HTML5 Canvas APIs.
