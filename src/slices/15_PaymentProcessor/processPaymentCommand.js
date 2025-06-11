// src/slices/15_PaymentProcessor/createPaymentCommand.js
import { v4 as uuidv4 } from 'uuid';

export function processPaymentCommand(paymentDetails, month) {
 

  return {
    type: "PaymentProcessed",
    paymentId: paymentDetails.paymentId,
    timestamp: Date.now(),
    payload: {
      month,
      amount: paymentDetails.Payment,
      paymentDate: paymentDetails.Date,
    },
  };
}
