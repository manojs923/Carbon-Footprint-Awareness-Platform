# EcoTrack India: Gamified Carbon Intelligence Platform

**EcoTrack India** is a highly interactive Progressive Web App (PWA) designed to calculate, analyze, and gamify personal carbon footprints for Indian citizens.

Live URL: [https://manojs923.github.io/Carbon-Footprint-Awareness-Platform/](https://manojs923.github.io/Carbon-Footprint-Awareness-Platform/)

---

## 🎯 Chosen Vertical

**Persona:** Eco-Awareness & Carbon Footprint Tracking

We chose this vertical to shift the narrative from climate anxiety to actionable, data-driven habits. Standard carbon calculators are often tedious and provide generic advice. EcoTrack India solves this by gamifying the experience and leveraging dynamic AI for localized context.

---

## 🚀 Approach and Logic (Logical Decision Making Based on User Context)

Our approach focused on building a deeply contextual, logic-driven architecture that exhibits **logical decision making based on user context**. The platform was built entirely with HTML, CSS (Glassmorphism), and Vanilla JavaScript to ensure maximum efficiency, representing **clean and maintainable code** without relying on external bloat.

### Smart Logic Flow:

1. **Contextual Data Collection:** Collects user inputs across Transport (Scope 1/3), Home Energy (Scope 2), and Diet/Waste (Scope 3).
2. **Dynamic Algorithmic Processing:** Applies localized Indian emission factors. The logic recognizes that electricity calculation inherently depends on the chosen State—acknowledging that coal-heavy states have a drastically different grid emission factor than high-renewable states.
3. **Scoring Engine:** The total footprint is mathematically inverted and scaled to generate a dynamic "Carbon Credit Score" (0-850), mimicking a financial credit score based on user context.
4. **Smart Decision Making:** The AI engine maps the highest emission category (e.g., Petrol vs. Electricity) and the user's specific context (e.g., Diet Type, State) to an array of specific, personalized mitigation strategies.

---

## 🤖 Smart & Dynamic Assistant

Demonstrating the **ability to build a smart, dynamic assistant**, the core of EcoTrack India is the **Dynamic AI Carbon Coach**. Rather than outputting generic environmental tips, the assistant utilizes logical decision-making based on user context:

- It parses the user's calculated Scope 1, Scope 2, and Scope 3 emissions.
- It identifies the exact statistical bottleneck (e.g., if Scope 2 is highest, it retrieves their specific State's grid factor).
- It generates actionable math-based tips (e.g., "In your state, cutting AC by 2 hours saves X tonnes based on the 0.71 grid factor").

---

## 🌍 Practical and Real-World Usability

The application is built for actual citizens to use immediately without friction, ensuring **practical and real-world usability**:

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
