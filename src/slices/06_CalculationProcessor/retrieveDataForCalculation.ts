import { openResourceDB, getAllFromStore } from "../03_viewResources/openResourceDB";

interface ResourceRow {
  id: string;
  month: string;
  type: string;
  amount: number;
  status: string;
  changeId: string;
  timestamp: number;
  EVENT_ID: number; // Include EVENT_ID in the interface
}

export async function retrieveDataForCalculation(changeId: string, eventId: number) {
  try {
    console.log('Starting data retrieval process...');
    clearInterval(5000);
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

    
    console.log(`Extracted event ID: ${eventId} from changeId: ${changeId}`);

    const filteredRows = filterRowsByChangeIdAndStatus(allRows, changeId, eventId);
    console.log(`Filtered ${filteredRows.length} rows based on changeId and status.`);

    const monthlyCalculations = calculateMonthlyBenefits(filteredRows);
    logMonthlyCalculations(monthlyCalculations);
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

function filterRowsByChangeIdAndStatus(rows: ResourceRow[], changeId: string, eventId: number): ResourceRow[] {
  console.log(`Filtering rows by changeId: ${changeId} and eventId: ${eventId}`);
  const filteredRows = rows.filter(row => {
    const matches = row.changeId === changeId && row.status === "Pushed" && row.EVENT_ID <= eventId;
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
