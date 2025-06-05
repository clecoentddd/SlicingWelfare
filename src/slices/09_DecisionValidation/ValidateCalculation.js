import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';
import { publishDecisionApproval } from '../11_DecisionApprovalForPayment/PublishDecisionApproval';
import { openDecisionDB, addToStore } from "../shared/openDecisionDB.js";
import { addEventToDecisionProjection } from '../10_DecisionProjection/DecisionProjection.js';

export async function validateDecision(calculationId, changeId, month, amount) {
  try {
    // Create a DecisionCalculationValidated event
    const decisionEvent = {
      type: "DecisionCalculationValidated",
      eventId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Decision",
      payload: {
        decisionId: uuidv4(),
        calculationId,
        changeId,
        month,
        amount
      }
    };

    // Use appendEvent to store the DecisionCalculationValidated event in eventDB
    const storedEvent = await appendEvent(decisionEvent);
    console.log(`DecisionCalculationValidated event stored with eventId: ${storedEvent.eventId}`);

    // Project the stored event to the decision projection
    await addEventToDecisionProjection(storedEvent);

    // Publish DecisionApprovedForPaymentReconciliation event
    await publishDecisionApproval(calculationId, changeId, month, amount);

    return storedEvent;
  } catch (error) {
    console.error("Error validating decision:", error);
    throw error;
  }
}
