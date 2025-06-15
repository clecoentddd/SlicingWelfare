// src/slices/15_PaymentProcessor/PaymentProcessor.js

import { handlePayment } from './processPaymentHandler';

export async function processPayments(paymentPlan) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so we add 1
  const currentYear = currentDate.getFullYear();
  const processedPayments = [];

  for (const [monthKey, details] of Object.entries(paymentPlan.payments)) {
    // Split the month string into month and year parts
    const [monthStr, yearStr] = monthKey.split('-');
    const paymentMonth = parseInt(monthStr, 10);
    const paymentYear = parseInt(yearStr, 10);

    // Check if the payment month is less than the current month and year
    if (
      paymentYear < currentYear ||
      (paymentYear === currentYear && paymentMonth < currentMonth)
    ) {
      const processedPayment = await handlePayment(details, monthKey);
      processedPayments.push(processedPayment);
    }
  }

  return processedPayments;
}


function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
