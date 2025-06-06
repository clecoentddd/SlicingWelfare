// src/slices/08_CalculationReadModel/calculationReadModel.js

import { openCalculationDB } from "../shared/openCalculationDB";

export async function fetchCalculations() {
  try {
    const db = await openCalculationDB();
    const tx = db.transaction("monthlyCalculations", "readonly");
    const store = tx.objectStore("monthlyCalculations");

    const result = await store.getAll();

    // Sort by timestamp (most recent first) and then by month (most recent first)
    result.sort((a, b) => {
      if (b.timestamp !== a.timestamp) {
        return b.timestamp - a.timestamp;
      }
      return b.month.localeCompare(a.month);
    });

    return result;
  } catch (err) {
    console.error("Failed to fetch from 'monthlyCalculations' store or open CalculationDB:", err);
    return [];
  }
}

export function filterCalculations(calculations, filterCalculationId, filterChangeId, filterStatus) {
  return calculations.filter(calc => {
    const matchesCalculationId = calc.calculationId.includes(filterCalculationId);
    const matchesChangeId = calc.changeId.includes(filterChangeId);
    const matchesStatus = calc.type ? calc.type.includes(filterStatus) : false;

    return matchesCalculationId && matchesChangeId && (filterStatus === '' || matchesStatus);
  });
}

export async function getMonthlyCalculationsByCalculationId(calculationId) {
  try {
    console.log(`Fetching calculations for calculationId: ${calculationId}`);
    const calculations = await fetchCalculations();
    console.log('All calculations:', calculations);

    // Filter calculations by calculationId
    const filteredCalculations = calculations.filter(calc => calc.calculationId === calculationId);
    console.log(`Filtered calculations for calculationId ${calculationId}:`, filteredCalculations);

    if (filteredCalculations.length === 0) {
      console.warn(`No calculations found for calculationId: ${calculationId}`);
      return {};
    }

    // Use netAmount instead of amount
    const monthlyCalculations = filteredCalculations.reduce((acc, calc) => {
      console.log(`Processing calculation for month: ${calc.month} with netAmount: ${calc.netAmount}`);
      if (calc.netAmount === undefined) {
        console.warn(`netAmount is undefined for month: ${calc.month}`);
      }
      acc[calc.month] = calc.netAmount;
      return acc;
    }, {});

    console.log(`Monthly calculations for calculationId ${calculationId}:`, monthlyCalculations);
    return monthlyCalculations;
  } catch (err) {
    console.error("Failed to fetch monthly calculations by calculationId:", err);
    return {};
  }
}

