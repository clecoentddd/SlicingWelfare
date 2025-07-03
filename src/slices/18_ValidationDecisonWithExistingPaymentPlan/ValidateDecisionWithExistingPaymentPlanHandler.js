import { appendEvent, getAllEvents } from '../../eventStore/eventRepository';
import { validationDecisionWithExistingPaymentPlanCommand } from './ValidateDecisionWithExistingPaymentPlanCommand.js';
import { domainEventEmitter } from '../shared/eventEmitter';
import { integrationEventEmitter } from '../shared/eventEmitter';

export async function validationDecisionWithExistingPaymentPlanHandler(calculationId, changeId, paymentPlanId) {
  try {
    if (!calculationId) throw new Error('Calculation ID is required.');
    if (!paymentPlanId) throw new Error('Payment Plan ID is required.');

    console.log(`validationDecisionHandler: Starting decision validation for calculationId: ${calculationId}`);

    // ✅ Check if decision already exists for this calculationId
    const events = await getAllEvents();
    const existingDecision = events.find(
      (event) =>
        event.aggregate === 'Decision' &&
        ['DecisionCalculationValidated', 'DecisionCalculationValidatedWithExistingPaymentPlan'].includes(event.type) &&
        event.payload.calculationId === calculationId
    );

    if (existingDecision) {
      alert(`A decision already exists for calculationId ${calculationId}`);
      throw new Error(`A decision has already been made for calculationId: ${calculationId}`);
    }

    // Proceed if no prior decision exists
    const decisionEvent = await validationDecisionWithExistingPaymentPlanCommand(calculationId, changeId, paymentPlanId);

    const storedEvent = await appendEvent(decisionEvent);
    console.log(`validationDecisionHandler: Event stored with decisionId: ${storedEvent.decisionId}`);

    domainEventEmitter.publish('DecisionCalculationValidatedWithExistingPaymentPlan', storedEvent);
    integrationEventEmitter.publish('DecisionCalculationValidatedWithExistingPaymentPlan', storedEvent);

    return storedEvent;

  } catch (error) {
    console.error("Error in validationDecisionWithExistingPaymentPlanHandler:", error);
    throw error;
  }
}
