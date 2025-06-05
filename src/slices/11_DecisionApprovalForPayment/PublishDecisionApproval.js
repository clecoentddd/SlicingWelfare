// src/slices/11_DecisionApprovalForPayment/PublishDecisionApproval.js

import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';

export async function publishDecisionApproval(calculationId, changeId, month, amount) {
  try {
    // Create a DecisionApprovedForPaymentReconciliation event
    const decisionApprovalEvent = {
      type: "DecisionApprovedForPaymentReconciliation",
      eventId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Payment",
      payload: {
        decisionId: uuidv4(),
        calculationId,
        changeId,
        month,
        amount,
        previousPaymentId: "" // Initially empty
      }
    };

    // Use appendEvent to store the DecisionApprovedForPaymentReconciliation event in eventDB
    await appendEvent(decisionApprovalEvent);
    console.log(`DecisionApprovedForPaymentReconciliation event stored with eventId: ${decisionApprovalEvent.eventId}`);

    return decisionApprovalEvent;
  } catch (error) {
    console.error("Error publishing decision approval:", error);
    throw error;
  }
}
