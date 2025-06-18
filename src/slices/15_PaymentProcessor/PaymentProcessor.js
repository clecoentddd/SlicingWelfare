// src/slices/15_PaymentProcessor/PaymentProcessor.js

import { handlePayment } from './processPaymentHandler';

export async function processPayments(paymentPlan) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so we add 1
  const currentYear = currentDate.getFullYear();
  const processedPayments = [];

  console.log(`Starting to process payments for plan with current date: ${currentDate}`);
   console.log(`Processing payment ***: ${paymentPlan}`);

  for (const [monthKey, details] of Object.entries(paymentPlan.payments)) {
    console.log(`Processing payment for month: ${monthKey}`);

    // Correctly split month and year
    const parts = monthKey.split('-');
    if (parts.length !== 2) {
      console.error(`Invalid monthKey format: ${monthKey}`);
      continue; // Skip processing of invalid entries
    }

    const paymentMonth = parseInt(parts[0], 10);
    const paymentYear = parseInt(parts[1], 10);

    if (isNaN(paymentMonth) || isNaN(paymentYear)) {
      console.error(`Invalid month or year in monthKey: ${monthKey}`);
      continue; // Skip processing of invalid entries
    }

    console.log(`Parsed month: ${paymentMonth}, year: ${paymentYear}`);

    // Check if the payment month is less than the current month and year
    if (
      paymentYear < currentYear ||
      (paymentYear === currentYear && paymentMonth < currentMonth)
    ) {
      console.log(`Payment for ${monthKey} is due; processing payment...`);
      const processedPayment = await handlePayment(details, monthKey);
      processedPayments.push(processedPayment);
      console.log(`Successfully processed payment for month: ${monthKey}`);
    } else {
      console.log(`Payment for ${monthKey} is not due yet; skipping.`);
    }
  }

  console.log(`Finished processing payments. Processed payments count: ${processedPayments.length}`);
  return processedPayments;
}




function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
