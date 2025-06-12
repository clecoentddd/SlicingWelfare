// src/slices/15_PaymentProcessor/createPaymentCommand.js
import { v4 as uuidv4 } from 'uuid';

export function processPaymentCommand(paymentDetails, month) {
  return {
    type: "PaymentProcessed",
    paymentId: paymentDetails.paymentId,
    aggregate: "PaymentPlan",
    timestamp: new Date().toISOString(), // Use ISO string for consistency
    payload: {
      month: paymentDetails.month, // Changed from Month to month
      amount: paymentDetails.amount, // Changed from Payment to payment
      paymentDate: paymentDetails.date, // Changed from Date to date
    },
  };
}