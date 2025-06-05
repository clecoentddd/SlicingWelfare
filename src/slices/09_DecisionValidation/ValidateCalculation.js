import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';
import { publishDomainEventDecisionApproved } from '../11_DecisionApprovalForPayment/PublishDecisionApproval';
import { getCalculationById } from "../../eventStore/eventRepository";
import { addEventToDecisionProjection } from '../10_DecisionProjection/DecisionProjection.js';

export async function validateDecision(calculationId, changeId, month, amount) {
  try {
   // Retrieve the CalculationPerformed event to get the monthly calculations
   console.log(`validateDecision: Retrieving CalculationPerformed event for calculationId: ${calculationId}`); 
   const calculationEvent = await getCalculationById(calculationId);
    if (!calculationEvent) {
      throw new Error(`CalculationPerformed event not found for calculationId: ${calculationId}`);
    }
    console.log(`validateDecision: CalculationPerformed event retrieved successfully for calculationId: ${calculationId}`);
    
    const { monthlyCalculations } = calculationEvent.payload;
    if (!monthlyCalculations) {
      throw new Error(`monthlyCalculations not found in CalculationPerformed event`);
    }

    // Aggregate monthly calculations into a single payload
    const aggregatedCalculations = Object.entries(monthlyCalculations).map(([month, calculation]) => ({
      month,
      ...calculation
    }));

    // Create a single DecisionCalculationValidated event
    const decisionEvent = {
      type: "DecisionCalculationValidated",
      eventId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Decision",
      payload: {
        decisionId: uuidv4(),
        calculationId,
        changeId,
        calculations: aggregatedCalculations // Include all monthly calculations
      }
    };

    // Use appendEvent to store the DecisionCalculationValidated event in eventDB
    const storedEvent = await appendEvent(decisionEvent);
    console.log(`DecisionCalculationValidated event stored with eventId: ${storedEvent.eventId}`);

    // Project the stored event to the decision projection
    await addEventToDecisionProjection(storedEvent);

    // Publish DecisionApprovedForPaymentReconciliation event
    console.log('validateDecision: Triggering domain event emission');
    await publishDomainEventDecisionApproved (storedEvent);
    console.log('validateDecision: Emitted domain event emission');

    return storedEvent;
  } catch (error) {
    console.error("Error validating decision:", error);
    throw error;
  }
}
