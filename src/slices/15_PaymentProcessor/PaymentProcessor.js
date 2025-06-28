// src/slices/15_PaymentProcessor/PaymentProcessor.js

import { handlePayment } from './processPaymentHandler';
import { fetchUnprocessedTransactionsFromEventStore } from '../../eventStore/services/GetPaymentsProcessedFromES';

export async function processPayments() {
  const {
    latestPaymentPlanId,
    unprocessedTransactions
  } = await fetchUnprocessedTransactionsFromEventStore();

  if (!latestPaymentPlanId) {
    throw new Error("❌ No latest payment plan found.");
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const processedPayments = [];

  console.log(`[Processor] Processing unprocessed transactions for plan ${latestPaymentPlanId}`);

  for (const tx of unprocessedTransactions) {
    const { month, amount, paymentId, status } = tx;

    console.log(`🔍 Transaction:`, tx);

    const [monthStr, yearStr] = month.split("-");
    const txMonth = parseInt(monthStr, 10);
    const txYear = parseInt(yearStr, 10);

    if (isNaN(txMonth) || isNaN(txYear)) {
      console.warn(`⚠️ Invalid month format for transaction ${paymentId}: ${month}`);
      continue;
    }

    if (
      txYear < currentYear ||
      (txYear === currentYear && txMonth < currentMonth)
    ) {
      console.log(`✅ Processing ${status} for ${month} (ID: ${paymentId})`);
      const processed = await handlePayment(tx, month);
      processedPayments.push(processed);
    } else {
      console.log(`⏭️ Skipping future transaction for ${month} (ID: ${paymentId})`);
    }
  }

  console.log(`🎉 Done. Total processed: ${processedPayments.length}`);
  return processedPayments;
}
