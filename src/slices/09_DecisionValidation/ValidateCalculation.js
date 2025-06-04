// src/slices/09_DecisionValidation/ValidateCalculation.js

import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';

export async function validateDecision(calculationId, changeId) {
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
        changeId
      }
    };

    // Store the DecisionCalculationValidated event in eventDB
    await appendEvent(decisionEvent);
    console.log(`DecisionCalculationValidated event stored with eventId: ${decisionEvent.eventId}`);

    return decisionEvent;
  } catch (error) {
    console.error("Error validating decision:", error);
    throw error;
  }
}
