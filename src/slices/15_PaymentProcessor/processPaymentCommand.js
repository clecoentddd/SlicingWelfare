// src/slices/15_PaymentProcessor/createPaymentCommand.js
import { v4 as uuidv4 } from 'uuid';

export function processPaymentCommand(paymentDetails, month) {
  console.log("processPaymentCommand", paymentDetails);
  const isReimbursement = paymentDetails.amount < 0;

  if (isReimbursement) {
    console.log(`Reimbursement detected for paymentId ${paymentDetails.paymentId} in month ${month} with amount ${paymentDetails.amount}`);
  } else {
    console.log(`Payment processed for paymentId ${paymentDetails.paymentId} in month ${month} with amount ${paymentDetails.amount}`);
  }

  return {
    type: "TransactionProcessed",
    paymentId: paymentDetails.paymentId,
    aggregate: "PaymentPlan",
    timestamp: new Date().toISOString(), // ISO string for consistency
    payload: {
      month: paymentDetails.month,      // use month from paymentDetails, consistent with your original code
      amount: paymentDetails.amount,
      paymentDate: paymentDetails.date,
    },
  };
}
