// src/slices/08_DecisionsInformation/DecisionsReadModel.js

import { openCalculationDB } from "../shared/openCalculationDB";
import { openResourceDB } from "../shared/openResourceDB";

export async function fetchCalculationIds() {
  try {
    const calculationDb = await openCalculationDB();
    const calculationTx = calculationDb.transaction("monthlyCalculations", "readonly");
    const calculationStore = calculationTx.objectStore("monthlyCalculations");
    const calculations = await calculationStore.getAll();

    // Extract unique calculationIds
    const uniqueCalculationIds = [...new Set(calculations.map(calc => calc.calculationId))];
    return uniqueCalculationIds;
  } catch (err) {
    console.error("Failed to fetch calculation IDs:", err);
    return [];
  }
}

export async function fetchDecisionsByCalculationId(calculationId) {
  try {
    // Fetch calculations from calculationDB
    const calculationDb = await openCalculationDB();
    const calculationTx = calculationDb.transaction("monthlyCalculations", "readonly");
    const calculationStore = calculationTx.objectStore("monthlyCalculations");
    const calculations = await calculationStore.getAll();

    // Filter calculations by calculationId
    const filteredCalculations = calculations.filter(calc => calc.calculationId === calculationId);

    // Fetch resources from resourceDB
    const resourceDb = await openResourceDB();
    const resourceTx = resourceDb.transaction("resources", "readonly");
    const resourceStore = resourceTx.objectStore("resources");
    const resources = await resourceStore.getAll();

    // Match resources with calculations based on changeId and month
    const decisions = filteredCalculations.map(calc => {
      const matchedResources = resources.filter(resource =>
        resource.changeId === calc.changeId && resource.month === calc.month
      );
      return {
        ...calc,
        resources: matchedResources
      };
    });

    return decisions;
  } catch (err) {
    console.error("Failed to fetch decisions:", err);
    return [];
  }
}
