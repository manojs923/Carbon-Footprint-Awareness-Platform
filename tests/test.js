const assert = require("assert");

const {
  CITY_AVG,
  EF,
  FLIGHT_CO2_KG,
  HISTORY_STORAGE_KEY,
  INDIA_AVG,
  MAX_HISTORY_ENTRIES,
  TREE_OFFSET_KG,
  calculateBreakdown,
  calculateCreditScore,
  calculateEquivalentFacts,
  getCityAverage,
  getCityTip,
  getFootprintHistory,
  getHotspotInsight,
  saveFootprintHistory,
  getScoreTier,
  prefersReducedMotion,
} = require("./../app.js");

function createMockStorage() {
  const store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

console.log("Starting Carbon Footprint Calculator Tests...\n");

try {
  let elecUsage = 100;
  let expectedElecCo2 = 100 * 0.82;
  assert.strictEqual(
    elecUsage * EF.electricity.National,
    expectedElecCo2,
    "Electricity calculation failed",
  );
  console.log("Test 1 Passed: Electricity Emission Factor (Scope 2)");

  let petrolUsage = 50;
  let expectedPetrolCo2 = 115.5;
  assert.strictEqual(
    petrolUsage * EF.petrol,
    expectedPetrolCo2,
    "Petrol calculation failed",
  );
  console.log("Test 2 Passed: Petrol Emission Factor (Scope 1)");

  let trainUsage = 500;
  let expectedTrainCo2 = 20.5;
  assert.strictEqual(
    trainUsage * EF.train,
    expectedTrainCo2,
    "Train calculation failed",
  );
  console.log("Test 3 Passed: Train Travel Emission Factor (Scope 3)");

  let lpgCylinders = 1;
  let lpgKg = lpgCylinders * 14.2;
  let expectedLpgCo2 = 42.316;
  assert.ok(
    Math.abs(lpgKg * EF.lpg - expectedLpgCo2) < 0.001,
    "LPG calculation failed",
  );
  console.log("Test 4 Passed: LPG Emission Factor (Scope 1)");

  assert.strictEqual(
    calculateCreditScore(0, INDIA_AVG),
    850,
    "Credit score should be 850 for zero tonnes",
  );
  console.log("Test 5 Passed: Credit Score = 850 at 0 tonnes");

  assert.strictEqual(
    calculateCreditScore(INDIA_AVG, INDIA_AVG),
    425,
    "Credit score should be 425 at India average",
  );
  console.log("Test 6 Passed: Credit Score = 425 at 1.9 tonnes");

  assert.strictEqual(
    calculateCreditScore(3.8, INDIA_AVG),
    0,
    "Credit score should be 0 at 3.8 tonnes",
  );
  assert.strictEqual(
    calculateCreditScore(4.5, INDIA_AVG),
    0,
    "Credit score should stay 0 above 3.8 tonnes",
  );
  console.log("Test 7 Passed: Credit Score floor at high emissions");

  const facts = calculateEquivalentFacts(1.7);
  assert.ok(
    Math.abs(facts.treesNeeded - 1700 / TREE_OFFSET_KG) < 0.001,
    "Tree equivalent fact failed",
  );
  assert.ok(
    Math.abs(facts.kmByCar - (1700 / 2.31) * 15) < 0.001,
    "Driving equivalent fact failed",
  );
  assert.ok(
    Math.abs(facts.flightsMumbaiDelhi - 1700 / FLIGHT_CO2_KG) < 0.001,
    "Flight equivalent fact failed",
  );
  console.log("Test 8 Passed: Equivalent facts calculations");

  assert.strictEqual(
    getCityAverage("Delhi"),
    2.8,
    "Delhi average lookup failed",
  );
  assert.strictEqual(
    getCityAverage("Jaipur"),
    1.95,
    "Jaipur average lookup failed",
  );
  console.log("Test 9 Passed: City average lookup");

  assert.strictEqual(
    Object.keys(CITY_AVG).length,
    10,
    "All 10 city averages should be defined",
  );
  console.log("Test 10 Passed: All 10 city averages defined");

  assert.strictEqual(EF.diet.vegan, 100, "Vegan dietary factor incorrect");
  assert.strictEqual(
    EF.diet.vegetarian,
    150,
    "Vegetarian dietary factor incorrect",
  );
  assert.strictEqual(
    EF.diet.omnivore,
    250,
    "Omnivore dietary factor incorrect",
  );
  console.log("Test 11 Passed: Dietary preference CO2 values");

  const breakdown = calculateBreakdown({
    state: "Delhi",
    electricity: 100,
    petrol: 20,
    train: 50,
    lpgCylinders: 1,
    diet: "vegetarian",
  });
  assert.strictEqual(
    Number(breakdown.monthlyKg.diet.toFixed(1)),
    150.0,
    "Breakdown diet monthly value incorrect",
  );
  assert.ok(
    breakdown.totalAnnualKg > 0,
    "Breakdown total annual kg should be positive",
  );
  console.log("Test 12 Passed: Emission breakdown calculation");

  const mockStorage = createMockStorage();
  saveFootprintHistory(
    {
      timestamp: "2026-06-08T10:00:00.000Z",
      total: 2.4,
      score: 313,
      city: "Mumbai",
    },
    mockStorage,
  );
  const savedHistory = getFootprintHistory(mockStorage);
  assert.strictEqual(savedHistory.length, 1, "History should save one entry");
  assert.strictEqual(
    savedHistory[0].city,
    "Mumbai",
    "Saved history city mismatch",
  );
  assert.ok(
    mockStorage.getItem(HISTORY_STORAGE_KEY),
    "Storage key should be populated",
  );
  console.log("Test 13 Passed: localStorage save and retrieve works");

  for (let i = 0; i < MAX_HISTORY_ENTRIES + 2; i += 1) {
    saveFootprintHistory(
      {
        timestamp: `2026-06-08T10:0${i}:00.000Z`,
        total: i,
        score: 850 - i,
        city: "Delhi",
      },
      mockStorage,
    );
  }
  const trimmedHistory = getFootprintHistory(mockStorage);
  assert.strictEqual(
    trimmedHistory.length,
    MAX_HISTORY_ENTRIES,
    "History should keep max 6 entries",
  );
  assert.strictEqual(
    trimmedHistory[0].total,
    2,
    "Oldest entries should be replaced first",
  );
  console.log("Test 14 Passed: History trims to 6 latest entries");

  const cityTip = getCityTip("Delhi", 2.6);
  assert.ok(cityTip.includes("Delhi"), "City tip should be Delhi-specific");
  console.log("Test 15 Passed: City-specific tips helper");

  const hotspot = getHotspotInsight(breakdown);
  assert.ok(
    hotspot.includes("Diet") ||
      hotspot.includes("Petrol") ||
      hotspot.includes("Electricity"),
    "Hotspot insight should mention a top category",
  );
  assert.ok(
    hotspot.includes("%"),
    "Hotspot insight should include contribution percentage",
  );
  assert.ok(
    hotspot.includes("saves") || hotspot.includes("save"),
    "Hotspot insight should include quantified savings tip",
  );
  console.log("Test 16 Passed: Hotspot insight helper");

  assert.strictEqual(getScoreTier(200).label, "CARBON ROOKIE", "Tier logic failed for 200");
  assert.strictEqual(getScoreTier(400).label, "ECO AWARE", "Tier logic failed for 400");
  assert.strictEqual(getScoreTier(600).label, "GREEN CHAMPION", "Tier logic failed for 600");
  assert.strictEqual(getScoreTier(800).label, "CARBON HERO", "Tier logic failed for 800");
  console.log("Test 17 Passed: Score tier calculation");

  assert.strictEqual(typeof prefersReducedMotion(), "boolean", "Reduced motion should return boolean");
  console.log("Test 18 Passed: Reduced motion helper");

  console.log("\nAll tests passed successfully!");
} catch (error) {
  console.error("Test Failed:", error.message);
  process.exit(1);
}
