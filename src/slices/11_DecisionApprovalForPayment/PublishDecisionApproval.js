// src/slices/11_DecisionApprovalForPayment/PublishDecisionApproval.js
import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';
import { integrationEventEmitter } from '../shared/eventEmitter';
import { getMonthlyCalculationsByCalculationId } from '../07_CalculationProjection/calculationReadModel';

export async function publishDomainEventDecisionApproved(storedEvent) {
  try {
    console.log('Creating domain event from stored event:', storedEvent);

    // Retrieve monthly calculations from the projection
    const monthlyCalculations = await getMonthlyCalculationsByCalculationId(storedEvent.payload.calculationId);

    if (Object.keys(monthlyCalculations).length === 0) {
      throw new Error("Calculation Projection: missing calculationId - Rebuild your projection!");
    }

    const domainEvent = {
      type: "DecisionApprovedForPaymentReconciliation",
      eventId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Decision",
      domainEvent: true,
      payload: {
        decisionId: storedEvent.decisionId,
        calculationId: storedEvent.payload.calculationId,
        changeId: storedEvent.payload.changeId,
        previousPaymentId: "",
        // Add month and amount from the stored event's payload
        payments: monthlyCalculations,
      }
    };

    console.log('Storing domain event in EventDB:', domainEvent);
    await appendEvent(domainEvent);
    console.log(`Domain event ${domainEvent.type} stored with eventId: ${domainEvent.eventId}`);

    console.log('Emitting domain event:', domainEvent);
    integrationEventEmitter.publish('DecisionApprovedForPaymentReconciliation', domainEvent);
    console.log(`Emitted event: ${domainEvent.type} with eventId: ${domainEvent.eventId}`);

    return domainEvent;
  } catch (error) {
    console.error("Error publishing domain event:", error);
    throw error;
  }
}
