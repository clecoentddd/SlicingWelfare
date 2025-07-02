import { clearLedgerDB, addLedgerEntry, getAllLedgerEntries, removeLedgerEntry } from '../shared/openLedgerDB';
import { getAllEvents } from '../../eventStore/eventRepository';
import { updateMonthSummary } from './BigBookProjectionHelpers';

// Remove all "ToBePaid" or calculation entries for a month
async function removePreviousCalculation(month) {
  const allEntries = await getAllLedgerEntries();
  const toRemove = allEntries.filter(
    e => e.month === month && (e.type === "ToBePaid" || e.type === "Calculation")
  );
  for (const entry of toRemove) {
    await removeLedgerEntry(entry.id);
  }
}

async function recordEntry(type, amount, referenceId, month) {
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

// Main rebuild function
export const rebuildLedger = async () => {
  console.log('Starting to rebuild ledger projection...');

  const success = await cleanLedger();
  if (!success) {
    console.error('Failed to clear the ledger database.');
    return;
  }

  console.log('Ledger database cleared. Fetching events from EventStore...');

  try {
    const events = await getAllEvents();
    console.log('Fetched events:', events);

    // Only process relevant events, in order
    const filteredEvents = events
      .filter(event =>
        ['DecisionValidatedWithPayments', 'DecisionCalculationValidatedWithExistingPaymentPlan', 'TransactionProcessed'].includes(event.type)
      )
      .sort((a, b) => a.id - b.id);

    for (const event of filteredEvents) {
      if (event.type === 'DecisionValidatedWithPayments') {
        for (const calc of event.payload.calculations) {
          await recordEntry('ToBePaid', calc.netAmount, event.decisionId, calc.month);
        }
      } else if (event.type === 'DecisionCalculationValidatedWithExistingPaymentPlan') {
        for (const calc of event.payload.calculations) {
          await recordEntry('ToBePaid', calc.netAmount, event.decisionId, calc.month);
        }
      } else if (event.type === 'TransactionProcessed') {
        const { amount, month } = event.payload;
        await recordEntry('Processed', amount, event.paymentId, month); // Use amount, not -amount
      }
    }

    console.log('Ledger projection rebuilt successfully.');
  } catch (error) {
    console.error('Failed to fetch or process events:', error);
  }
};

export async function cleanLedger() {
  const success = await clearLedgerDB();
  if (!success) {
    console.error('Failed to clear the ledger database.');
    return false;
  }
  console.log('Ledger database cleared.');
  return true;
}