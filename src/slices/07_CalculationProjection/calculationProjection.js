// src/slices/07_CalculationProjection/calculationProjection.js

import { openCalculationDB, addToStore } from "../shared/openCalculationDB";
import { v4 as uuidv4 } from 'uuid';

export async function projectCalculationEvents(monthlyCalculations, changeId, type) {
  try {
    const calculationDb = await openCalculationDB();
    const calculationTx = calculationDb.transaction("monthlyCalculations", "readwrite");
    const calculationStore = calculationTx.objectStore("monthlyCalculations");

    // Generate a unique calculationId for this set of calculations
    const calculationId = uuidv4();

    for (const month in monthlyCalculations) {
      const calculation = monthlyCalculations[month];
      const calculationEntry = {
        id: uuidv4(), // Unique ID for each row
        calculationId, // Common calculationId for all rows in this calculation
        changeId,
        month,
        type, // Include the type field from the event metadata
        timestamp: Date.now(), // Add the current timestamp
        ...calculation
      };
      await addToStore(calculationStore, calculationEntry);
    }

    console.log('Projection of calculation events completed successfully.');
  } catch (error) {
    console.error("Error projecting calculation events:", error);
  }
}
