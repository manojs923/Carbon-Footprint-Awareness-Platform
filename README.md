# 🌍 EcoTrack India — Carbon Footprint Awareness Platform

## 🎯 Challenge Vertical
Individual Consumers

## ✨ Features
- 🌿 Multi-step personal carbon calculator for home energy, transport, LPG, and diet
- 📈 Carbon Credit Score out of 850 with animated count-up and tier badge
- 🟢 Progress gauge showing score strength from red to green
- 🥧 Scope 1, 2, and 3 donut chart for emissions breakdown
- 🏙️ City comparison leaderboard with user, city, and India average bars
- 📜 Detailed GHG accounting table with monthly, annual, and percentage values
- 🕒 Carbon footprint history stored in `localStorage` with trend insights
- 📉 Personal history line chart with improvement or worsening indicators
- 🎉 Dynamic equivalent facts that rotate every 3 seconds
- 🖼️ Shareable carbon score card generated with the Canvas API
- 🌗 Dark and light mode with persisted preference
- 🎯 Weekly climate challenges for habit nudges
- 🔮 Scenario simulator for EV and solar adoption
- 🧾 One-click printable PDF report using `window.print()`
- 🤖 Rule-based AI Carbon Coach for tailored advice

## 🔬 How It Works
The calculator collects monthly activity inputs, converts them to kilograms of CO2 using India-specific or globally recognized emission factors, then annualizes the result.

Formula pattern:
`annual_kg_co2 = monthly_activity × emission_factor × 12`

Examples:
- Electricity: `monthly_kWh × 0.82 × 12`
- Petrol: `monthly_litres × 2.31 × 12`
- Train: `monthly_km × 0.041 × 12`
- LPG: `monthly_cylinders × 14.2 × 2.98 × 12`

The annual category totals are added together and converted to tonnes:
`total_tonnes = total_annual_kg / 1000`

The Carbon Credit Score then uses:
`score = Math.round(Math.max(0, 850 - (userTonnes / 1.9 * 425)))`

## 📊 Scope 1/2/3 Mapping
| Input | Scope | Why |
|------|------|------|
| Petrol Vehicle | Scope 1 | Direct fuel combustion by the individual |
| LPG Cooking | Scope 1 | Direct household fuel use |
| Electricity | Scope 2 | Purchased grid electricity |
| Train Travel | Scope 3 | Indirect public transport emissions |
| Diet | Scope 3 | Indirect upstream food-system emissions |

## 🇮🇳 India-Specific Data
- Electricity grid factor: `0.82 kg CO2/kWh` from India CEA 2023 grid average
- Petrol factor: `2.31 kg CO2/litre`
- LPG factor: `2.98 kg CO2/kg`
- Train factor: `0.041 kg CO2/km`
- India average annual footprint benchmark: `1.9 tonnes/year`
- City benchmark set includes Bengaluru, Mumbai, Delhi, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, Jaipur, and Surat

## 🚀 How to Run
Just open `index.html` in any browser. No installation needed.

## 🧪 Testing
Run: `node tests/test.js`

## 📐 Architecture
```text
[User Inputs]
      |
      v
[Vanilla HTML/CSS/JS UI]
      |
      v
[Emission Factor Engine]
      |
      +--> [Scope 1/2/3 Charts]
      +--> [Credit Score + Facts]
      +--> [History + localStorage]
      +--> [Canvas Share Card]
      |
      v
[Print / Export / Coaching Experience]
```

## ⚠️ Assumptions
- Users provide average monthly behaviour, not daily logs.
- LPG cylinders are standard domestic `14.2 kg` cylinders.
- Diet emissions are simplified monthly proxies to keep the form low-friction.
- Train travel is used as the primary public transport proxy.
- City averages are benchmarking values for comparison, not regulatory inventories.
- The India annual comparison baseline is `1.9 tonnes/year`.

## 📜 Data Sources
- India CEA 2023 Grid Emission Factor: 0.82 kg CO2/kWh
- IPCC AR6 dietary emission estimates
- MoRTH India vehicle fuel efficiency data
