// src/slices/15_PaymentProcessor/PaymentProcessor.js

import { handlePayment } from './processPaymentHandler';
import { fetchLatestPaymentsFromReplay} from '../../eventStore/services/GetPaymentsProcessedFromES';

export async function processPayments(paymentPlan) {
  const { paymentPlanId, payments } = paymentPlan;

  // Step 1: Fetch the latest payment plan ID from the DB
  const { latestPaymentPlanId } = await fetchLatestPaymentsFromReplay();

  if (paymentPlanId !== latestPaymentPlanId) {
  throw new Error(
    `Payment Plan selected (${paymentPlanId}) is out of date. Latest is (${latestPaymentPlanId}).`
  );
}

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = currentDate.getFullYear();
  const processedPayments = [];

  console.log(`Starting to process payments for plan ID: ${paymentPlanId} on ${currentDate}`);

  for (const [monthKey, details] of Object.entries(payments)) {
    console.log(`Processing payment for month: ${monthKey}`);

    const parts = monthKey.split('-');
    if (parts.length !== 2) {
      console.error(`Invalid monthKey format: ${monthKey}`);
      continue;
    }

    const paymentMonth = parseInt(parts[0], 10);
    const paymentYear = parseInt(parts[1], 10);

    if (isNaN(paymentMonth) || isNaN(paymentYear)) {
      console.error(`Invalid month or year in monthKey: ${monthKey}`);
      continue;
    }

    if (
      paymentYear < currentYear ||
      (paymentYear === currentYear && paymentMonth < currentMonth)
    ) {
      console.log(`Payment for ${monthKey} is due; processing...`);
      const processedPayment = await handlePayment(details, monthKey);
      processedPayments.push(processedPayment);
      console.log(`Successfully processed payment for ${monthKey}`);
    } else {
      console.log(`Payment for ${monthKey} is not due yet; skipping.`);
    }
  }

  console.log(`Finished processing. Total processed: ${processedPayments.length}`);
  return processedPayments;
}



function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
