// src/slices/08_DecisionsInformation/DecisionsReadModel.js

import { fetchCalculations } from '../shared/openCalculationDB';
import { fetchDecisions } from '../shared/openDecisionDB';

// Cache for calculations to avoid redundant fetches
let calculationsCache = null;

export async function fetchCalculationIds() {
  try {
    if (!calculationsCache) {
      calculationsCache = await fetchCalculations();
    }
    const ids = [...new Set(calculationsCache.map(calc => calc.calculationId))];
    return ids;
  } catch (err) {
    console.error("Failed to fetch calculation IDs:", err);
    return [];
  }
}

export async function fetchCalculationsByCalculationId(calculationId) {
  try {
    if (!calculationsCache) {
      calculationsCache = await fetchCalculations();
    }
    return calculationsCache.filter(calc => calc.calculationId === calculationId);
  } catch (err) {
    console.error("Failed to fetch calculations by calculation ID:", err);
    return [];
  }
}

export async function fetchAndSortDecisionsByCalculationId(calculationId) {
  try {
    const decisions = await fetchDecisions();
    const filteredDecisions = decisions.filter(decision => decision.calculationId === calculationId);
    const sortedDecisions = [...filteredDecisions].sort((a, b) => a.timestamp - b.timestamp);
    return sortedDecisions;
  } catch (err) {
    console.error("Failed to fetch and sort decisions:", err);
    return [];
  }
}
