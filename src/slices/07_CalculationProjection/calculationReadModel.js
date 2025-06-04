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
