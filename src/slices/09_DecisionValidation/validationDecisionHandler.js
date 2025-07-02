import { appendEvent } from '../../eventStore/eventRepository';
import { publishIntegrationEventDecisionApproved } from '../11_DecisionApprovalForPayment/PublishDecisionApproval';
import { validationDecisionCommand } from './validationDecisionCommand';
import { domainEventEmitter } from '../shared/eventEmitter';

export async function validationDecisionHandler(calculationId, changeId, month, amount) {
  try {
    console.log(`🔧 validationDecisionHandler: Validating decision for calculationId: ${calculationId}`);

    // Step 1: Build the event (command)
    const event = await validationDecisionCommand(calculationId, changeId);

    // Step 2: Append to event store
    const storedEvent = await appendEvent(event);
    console.log(`📦 Event stored in event store with ID: ${storedEvent.eventId || storedEvent.decisionId}`);

    // Step 3: Project to read model
    // Step 3: Publish via domain event emitter (decoupled)
    await domainEventEmitter.publish('DecisionValidatedWithPayments', storedEvent);
    console.log('📊 Projected event to decision projection.');

    // Step 4: Emit integration event
    await publishIntegrationEventDecisionApproved(storedEvent);
    console.log('📣 Emitted integration event for decision approval.');

    return storedEvent;

  } catch (error) {
    console.error("❌ Error in validationDecisionHandler:", error);
    throw error;
  }
}
