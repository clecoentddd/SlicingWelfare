// src/slices/07_CalculationProjection/calculationProjection.js

import { openCalculationDB, addToStore } from "../shared/openCalculationDB";
import { v4 as uuidv4 } from 'uuid';

export async function projectCalculationEvents(calculationId, monthlyCalculations, changeId, type) {
  try {
    console.log(`Starting projection of calculation events for calculationId: ${calculationId}`);

    // Open the calculation database
    const calculationDb = await openCalculationDB();
    console.log('Calculation database opened successfully.');

    // Start a readwrite transaction
    const calculationTx = calculationDb.transaction("monthlyCalculations", "readwrite");
    console.log('Transaction started for monthlyCalculations object store.');

    // Access the object store
    const calculationStore = calculationTx.objectStore("monthlyCalculations");
    console.log('Accessed monthlyCalculations object store.');

    // Iterate over each month in monthlyCalculations
    for (const month in monthlyCalculations) {
      const calculation = monthlyCalculations[month];
      console.log(`Processing calculation for month: ${month}`);

      // Create a calculation entry
      const calculationEntry = {
        id: uuidv4(), // Unique ID for each row
        calculationId, // Common calculationId for all rows in this calculation
        changeId,
        month,
        type, // Include the type field from the event metadata
        timestamp: Date.now(), // Add the current timestamp
        ...calculation
      };

      console.log(`Adding calculation entry to store: ${JSON.stringify(calculationEntry)}`);

      // Add the calculation entry to the store
      await addToStore(calculationStore, calculationEntry);
      console.log(`Successfully added calculation entry for month: ${month}`);
    }

    // Wait for the transaction to complete
    await calculationTx.done;
    console.log('Projection of calculation events completed successfully.');
  } catch (error) {
    console.error("Error projecting calculation events:", error);
  }
}
