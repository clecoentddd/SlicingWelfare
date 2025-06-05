// src/slices/12_PaymentPlanListener/SubscribePaymentPlan.js
import { eventEmitter } from '../shared/eventEmitter';
import { appendEvent } from '../../eventStore/eventRepository';

export function subscribeToPaymentPlanEvents() {
  console.log('Setting up event listener for DecisionApprovedForPaymentReconciliation');

  eventEmitter.on('DecisionApprovedForPaymentReconciliation', async (event) => {
    try {
      console.log("Event received in subscriber:", event);

      console.log('Storing received event in EventDB:', event);
      await appendEvent(event);
      console.log(`Event stored in EventDB with eventId: ${event.eventId}`);

      console.log("Processing event:", event);
      // Add your logic here to handle the event, e.g., build the payment plan
    } catch (error) {
      console.error("Error handling received event:", error);
    }
  });

  console.log("Subscribed to payment plan events. Waiting for events to be emitted...");
}
