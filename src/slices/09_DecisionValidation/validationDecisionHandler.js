import { appendEvent } from '../../eventStore/eventRepository';
import { publishIntegrationEventDecisionApproved } from '../11_DecisionApprovalForPayment/PublishDecisionApproval';
import { validationDecisionCommand } from './validationDecisionCommand';
import { domainEventEmitter } from '../shared/eventEmitter';
import { getAllEvents } from '../../eventStore/eventRepository.js';

export async function ensureNoExistingPaymentPlan() {
  const events = await getAllEvents();

  const exists = events.some((event) => event.type === 'PaymentPlanPrepared');

  if (exists) {
    const message = 'A payment plan has already been prepared for this case.';
    alert(message); // ✅ Show alert in browser
    throw new Error(message); // ❌ Also throw to stop further logic
  }
}

export async function validationDecisionHandler(calculationId, changeId, month, amount) {
  try {
    console.log(`🔧 validationDecisionHandler: Validating decision for calculationId: ${calculationId}`);

    // Use ensureNoExistingPaymentPlan to check
    await ensureNoExistingPaymentPlan(calculationId); // should throw if plan exists

    console.log('✅ No payment plan found. Proceeding with decision validation.');

    // Step 1: Build the event (command)
    const event = await validationDecisionCommand(calculationId, changeId);

    // Step 2: Append to event store
    const storedEvent = await appendEvent(event);
    console.log(`📦 Event stored in event store with ID: ${storedEvent.eventId || storedEvent.decisionId}`);

    // Step 3: Publish via domain event emitter
    await domainEventEmitter.publish('DecisionValidatedWithPayments', storedEvent);
    console.log('📊 Projected event to decision projection.');

    // Step 4: Emit integration event
    await publishIntegrationEventDecisionApproved(storedEvent);
    console.log('📣 Emitted integration event for decision approval.');

    return storedEvent;

  } catch (error) {
    // If ensureNoExistingPaymentPlan throws, catch here and alert
    if (error.message.includes('payment plan already prepared')) {
      alert(error.message);
    }
    console.error("❌ Error in validationDecisionHandler:", error);
    throw error;
  }
}
