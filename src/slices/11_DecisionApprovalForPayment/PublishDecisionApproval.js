// src/slices/11_DecisionApprovalForPayment/PublishDecisionApproval.js
import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';
import { eventEmitter } from '../shared/eventEmitter';

export async function publishDomainEventDecisionApproved(storedEvent) {
  try {
    console.log('Creating domain event from stored event:', storedEvent);

    const domainEvent = {
      type: "DecisionApprovedForPaymentReconciliation",
      eventId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Payment",
      payload: {
        decisionId: storedEvent.payload.decisionId,
        calculationId: storedEvent.payload.calculationId,
        changeId: storedEvent.payload.changeId,
        previousPaymentId: ""
      }
    };

    console.log('Storing domain event in EventDB:', domainEvent);
    await appendEvent(domainEvent);
    console.log(`Domain event ${domainEvent.type} stored with eventId: ${domainEvent.eventId}`);

    console.log('Emitting domain event:', domainEvent);
    eventEmitter.emit('DecisionApprovedForPaymentReconciliation', domainEvent);
    console.log(`Emitted event: ${domainEvent.type} with eventId: ${domainEvent.eventId}`);

    return domainEvent;
  } catch (error) {
    console.error("Error publishing domain event:", error);
    throw error;
  }
}
