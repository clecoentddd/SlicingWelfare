// src/slices/06_CalculationProcessor/processorCalculation.js

import { openResourceDB, getAllFromStore } from "../shared/openResourceDB";
import { appendEvent } from "../../eventStore/eventRepository";
import { v4 as uuidv4 } from 'uuid';
import { projectCalculationEvents} from '../07_CalculationProjection/calculationProjection'

export async function retrieveDataForCalculation(changeId, eventId) {
  try {
    console.log(`Starting data retrieval process for changeId: ${changeId} and eventId: ${eventId}`);
    const resourceDb = await openResourceDB();
    console.log('Resource database opened successfully.');

    const tx = resourceDb.transaction("resources", "readonly");
    const store = tx.objectStore("resources");

    const allRows = await getAllFromStore(store);
    console.log(`Retrieved ${allRows.length} rows from the store.`);

    allRows.sort((a, b) => b.timestamp - a.timestamp);
    allRows.sort((a, b) => b.month.localeCompare(a.month));

    const filteredRows = filterRowsByChangeIdAndStatus(allRows, changeId, eventId);
    console.log(`Filtered ${filteredRows.length} rows based on changeId and status.`);

    const monthlyCalculations = calculateMonthlyBenefits(filteredRows);
    console.log('Monthly calculations:', monthlyCalculations);

    // Create CalculationPerformed event
    const calculationEvent = {
      type: "CalculationPerformed",
      calculationId: uuidv4(),
      changeId: changeId,
      aggregate: "Calculation",
      payload: {  monthlyCalculations },
      timestamp: Date.now()
    };

    // Store the CalculationPerformed event in eventDB
    await appendEvent(calculationEvent);
    console.log(`CalculationPerformed event stored with calculationId: ${calculationEvent.calculationId}`);

    // Call the projection logic in Slice 07 with the necessary data
    await projectCalculationEvents(calculationEvent.calculationId, monthlyCalculations, changeId, calculationEvent.type);
    console.log('Projection of calculation events triggered successfully.');

  } catch (error) {
    console.error("Error processing data:", error);
  }
}


function filterRowsByChangeIdAndStatus(rows, changeId, eventId) {
  return rows.filter(row => row.changeId === changeId && row.status === "Pushed" && row.EVENT_ID <= eventId);
}

function calculateMonthlyBenefits(rows) {
  const monthlyData = {};
  rows.forEach(row => {
    if (!monthlyData[row.month]) {
      monthlyData[row.month] = { incomes: 0, expenses: 0 };
    }
    if (row.type === "Income") {
      monthlyData[row.month].incomes += row.amount;
    } else if (row.type === "Expense") {
      monthlyData[row.month].expenses += row.amount;
    }
  });

  const monthlyCalculations = {};
  for (const month in monthlyData) {
    const { incomes, expenses } = monthlyData[month];
    monthlyCalculations[month] = {
      incomes,
      expenses,
      netAmount: (incomes - expenses) * 0.1
    };
  }

  return monthlyCalculations;
}
