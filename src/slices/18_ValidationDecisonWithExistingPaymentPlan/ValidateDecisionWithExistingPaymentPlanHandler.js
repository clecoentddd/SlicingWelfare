import { appendEvent } from '../../eventStore/eventRepository';
import { validationDecisionWithExistingPaymentPlanCommand } from './ValidateDecisionWithExistingPaymentPlanCommand.js';
import { domainEventEmitter } from '../shared/eventEmitter';
import { integrationEventEmitter } from '../shared/eventEmitter';
export async function validationDecisionWithExistingPaymentPlanHandler(calculationId, changeId, paymentPlanId) {
  try {
    // Check if calculationId is provided
    if (!calculationId) {
      throw new Error('Calculation ID is required.');
    }

    // Check if paymentPlanId is provided
    if (!paymentPlanId) {
      throw new Error('Payment Plan ID is required.');
    }

    console.log(`validationDecisionHandler: Starting decision validation for calculationId: ${calculationId}`);

    // Call the command to validate the decision and create the event
    const decisionEvent = await validationDecisionWithExistingPaymentPlanCommand(calculationId, changeId, paymentPlanId);

    // Use appendEvent to store the DecisionCalculationValidated event in eventDB
    const storedEvent = await appendEvent(decisionEvent);
    console.log(`validationDecisionHandler: DecisionCalculationValidated event stored with eventId: ${storedEvent.decisionId}`);

    // Publish the domain event
    domainEventEmitter.publish('DecisionCalculationValidatedWithExistingPaymentPlan', storedEvent);
    console.log('validationDecisionHandler: Published domain event DecisionCalculationValidatedWithExistingPaymentPlan');


    // Publish DecisionApprovedForPaymentReconciliation event
    console.log('validationDecisionWithExistingPaymentPlanHandler: Triggering integration event emission');
    integrationEventEmitter.publish('DecisionCalculationValidatedWithExistingPaymentPlan', storedEvent);
    console.log('validationDecisionWithExistingPaymentPlanHandler: Emitted integration main event emission');

    return storedEvent;
  } catch (error) {
    console.error("Error in validationDecisionWithExistingPaymentPlanHandler:", error);
    throw error;
  }
}
