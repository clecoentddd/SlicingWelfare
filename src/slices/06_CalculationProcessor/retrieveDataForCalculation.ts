// src/slices/processorCalculation/retrieveDataForCalculation.ts
import { openResourceDB, getAllFromStore } from "../03_viewResources/openResourceDB";

interface ResourceRow {
  id: string;
  month: string;
  type: string;
  amount: number;
  status: string;
  changeId: string;
  timestamp: number;
}

export async function retrieveDataForCalculation(changeId: string) {
  try {
    console.log('Starting data retrieval process...');
    clearInterval(2000);
    console.log('Processor is listening for DataPushed events...');

    const db = await openResourceDB();
    console.log('Database opened successfully.');
    const tx = db.transaction("resources", "readonly");
    const store = tx.objectStore("resources");

    console.log('Retrieving all rows from the store...');
    const allRows = await getAllFromStore<ResourceRow>(store);
    console.log(`Retrieved ${allRows.length} rows from the store.`);

    console.log('Sorting rows by timestamp and month...');
    allRows.sort((a, b) => b.timestamp - a.timestamp);
    allRows.sort((a, b) => b.month.localeCompare(a.month));

    const baseId = extractBaseId(changeId);
    console.log(`Extracted base ID: ${baseId} from changeId: ${changeId}`);

    const filteredRows = filterRowsByChangeIdAndStatus(allRows, changeId, baseId);
    console.log(`Filtered ${filteredRows.length} rows based on changeId and status.`);

    const monthlyCalculations = calculateMonthlyBenefits(filteredRows);
    logMonthlyCalculations(monthlyCalculations);
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

function extractBaseId(id: string): number {
  const baseId = parseInt(id.split('-')[0], 10);
  console.log(`Extracting base ID: ${baseId} from ID: ${id}`);
  return baseId;
}

function filterRowsByChangeIdAndStatus(rows: ResourceRow[], changeId: string, baseId: number): ResourceRow[] {
  console.log(`Filtering rows by changeId: ${changeId} and baseId: ${baseId}`);
  const filteredRows = rows.filter(row => {
    const rowBaseId = extractBaseId(row.id);
    const matches = row.changeId === changeId && row.status === "Pushed" && rowBaseId <= baseId;
    console.log(`Row ${row.id} matches filter: ${matches}`);
    return matches;
  });
  return filteredRows;
}

function calculateMonthlyBenefits(rows: ResourceRow[]): Record<string, { incomes: number, expenses: number, result: number }> {
  console.log('Calculating monthly benefits...');
  const monthlyData: Record<string, { incomes: number, expenses: number }> = {};

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

  const monthlyCalculations: Record<string, { incomes: number, expenses: number, result: number }> = {};
  for (const month in monthlyData) {
    const { incomes, expenses } = monthlyData[month];
    monthlyCalculations[month] = {
      incomes,
      expenses,
      result: (incomes - expenses) * 0.1
    };
  }

  return monthlyCalculations;
}

function logMonthlyCalculations(monthlyCalculations: Record<string, { incomes: number, expenses: number, result: number }>) {
  console.log('Logging monthly calculations:');
  for (const month in monthlyCalculations) {
    const { incomes, expenses, result } = monthlyCalculations[month];
    console.log(`Month: ${month}`);
    console.log(`  Incomes: ${incomes}, Expenses: ${expenses}`);
    console.log(`  Calculation: (${incomes} - ${expenses}) * 10% = ${result}`);
  }
}
