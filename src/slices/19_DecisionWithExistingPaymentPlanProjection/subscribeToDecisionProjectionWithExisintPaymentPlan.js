// Import the domain event emitter and the projection function
import { domainEventEmitter } from '../shared/eventEmitter.js';
import { addEventToDecisionProjection } from '../10_DecisionProjection/DecisionProjection.js';

export function subscribeToDecisionProjectionWithExisintPaymentPlan() {
  domainEventEmitter.subscribe('DecisionCalculationValidatedWithExistingPaymentPlan', async (decisionEvent) => {
    try {
      console.log('Received domain event DecisionCalculationValidatedWithExistingPaymentPlan:', decisionEvent);
      await addEventToDecisionProjection(decisionEvent);
      console.log('Decision projection stored successfully.');
    } catch (error) {
      console.error("Error handling domain event DecisionCalculationValidatedWithExistingPaymentPlan:", error);
    }
  });

  console.log('Subscriber for DecisionCalculationValidatedWithExistingPaymentPlan is set up.');
}