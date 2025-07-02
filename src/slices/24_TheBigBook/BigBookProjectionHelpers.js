import { addLedgerEntry, getAllLedgerEntries, removeLedgerEntry } from '../shared/openLedgerDB';

// Remove all "ToBePaid" or calculation entries for a month
export async function removePreviousCalculation(month) {
  const allEntries = await getAllLedgerEntries();
  const toRemove = allEntries.filter(
    e => e.month === month && (e.type === "ToBePaid" || e.type === "Calculation")
  );
  for (const entry of toRemove) {
    await removeLedgerEntry(entry.id);
  }
}

// Helper to update or create a summary entry for a month
export async function updateMonthSummary(month) {
  const allEntries = await getAllLedgerEntries();
  const monthEntries = allEntries.filter(e => e.month === month && e.type !== "Summary");

  // Find the latest calculation (ToBePaid)
  const latestCalcEntry = monthEntries
    .filter(e => e.type === "ToBePaid")
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  const latestCalculation = latestCalcEntry ? Number(latestCalcEntry.amount) : 0;

  // Sum all processed transactions
  const transactions = monthEntries.filter(e => e.type === "Processed");
  const totalProcessed = transactions.reduce((sum, entry) => sum + Number(entry.amount), 0);

  // Balance = latestCalculation - totalProcessed
  const balance = latestCalculation - totalProcessed;

  const summaryEntry = {
    type: "Summary",
    month,
    latestCalculation,
    transactions,
    totalProcessed,
    balance,
    timestamp: Date.now(),
  };
  await addLedgerEntry(summaryEntry);
}
export async function recordEntry(type, amount, referenceId, month) {
  if (type === "ToBePaid") {
    await removePreviousCalculation(month);
  }
  const entry = {
    type,
    amount,
    referenceId,
    month,
    timestamp: Date.now(),
  };
  await addLedgerEntry(entry);
  if (month) {
    await updateMonthSummary(month);
  }
}