// src/slices/15_PaymentProcessor/PaymentProcessor.js

import { handlePayment } from './processPaymentHandler';

export async function processPayments(paymentPlan) {
  const currentDate = new Date();
  const processedPayments = [];

  for (const [month, details] of Object.entries(paymentPlan.payments)) {
    const paymentDate = new Date(details.Date);

    if (details.Date === 'Immediate' || isSameDay(paymentDate, currentDate)) {
      const processedPayment = await handlePayment(details, month);
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
