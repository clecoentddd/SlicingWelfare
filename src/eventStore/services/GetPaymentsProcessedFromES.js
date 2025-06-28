// src/services/paymentReplayService.js
import {computeNetProcessedAmountsPerMonth} from '../../slices/shared/computeProcessedTransactions';
import { getAllEvents } from '../eventRepository.js';


export async function fetchProcessedTransactionsFromEventStore() {
  const allEvents = await getAllEvents();
  let latestPlanEvent = null;

  const planPreparedEvents = allEvents.filter(e =>
    e.type === "PaymentPlanPrepared" || e.type === "PaymentPlanPreparedInReplacement"
  );

  planPreparedEvents.forEach(event => {
    if (!latestPlanEvent || new Date(event.timestamp) > new Date(latestPlanEvent.timestamp)) {
      latestPlanEvent = event;
    }
  });

  const transactions = [];

  allEvents.forEach(event => {
    if (event.type === "TransactionProcessed") {
      const { month, amount } = event.payload;
      if (month && typeof amount === 'number') {
        transactions.push({
          month,
          amount,
          status: event.type,
          paymentPlanId: event.paymentPlanId || null
        });
      } else {
        console.warn("⚠️ Malformed payment event skipped:", event);
      }
    }
  });

  const netAmounts = computeNetProcessedAmountsPerMonth(transactions);

  return {
    latestPaymentPlanId: latestPlanEvent?.paymentPlanId || null,
    netAmounts,
    rawTransactions: transactions
  };
}


export async function fetchUnprocessedTransactionsFromEventStore() {
  const allEvents = await getAllEvents();
  console.log(`📦 Total events fetched: ${allEvents.length}`);

  // Count and log event types
  const eventTypeCounts = allEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});
  console.log('🧾 Event types and counts:', eventTypeCounts);

  // Step 1: Find the latest payment plan event
  const planPreparedEvents = allEvents.filter(e =>
    e.type === "PaymentPlanPrepared" || e.type === "PaymentPlanPreparedInReplacement"
  );

  let latestPlanEvent = null;
  planPreparedEvents.forEach(event => {
    if (!latestPlanEvent || new Date(event.timestamp) > new Date(latestPlanEvent.timestamp)) {
      latestPlanEvent = event;
    }
  });

  if (!latestPlanEvent) {
    console.warn("⚠️ No latest payment plan found.");
    return { latestPaymentPlanId: null, unprocessedTransactions: [] };
  }

  const latestPaymentPlanId = latestPlanEvent.paymentPlanId;
  console.log(`📌 Latest paymentPlanId: ${latestPaymentPlanId}`);

  // Step 2: Extract all processed paymentIds
  const processedEvents = allEvents.filter(e => e.type === "TransactionProcessed");
  const processedIds = new Set(processedEvents.map(e => e.paymentId));
  console.log(`✅ Processed payment IDs (${processedIds.size}):`, Array.from(processedIds));

  // Step 3: Read unprocessed transactions from the payload of the latest plan event
  const allPlannedPayments = latestPlanEvent.payload?.payments || [];
  console.log(`📊 Total payments in latest plan: ${allPlannedPayments.length}`);

  const unprocessedTransactions = allPlannedPayments
    .filter(p => !processedIds.has(p.paymentId))
    .map(p => ({
      month: p.month,
      amount: p.amount,
      status: p.status,
      paymentId: p.paymentId,
      paymentPlanId: latestPaymentPlanId
    }));

  console.log(`🔍 Unprocessed transactions found: ${unprocessedTransactions.length}`);
  if (unprocessedTransactions.length > 0) {
    console.table(unprocessedTransactions);
  }

  return {
    latestPaymentPlanId,
    unprocessedTransactions
  };
}
