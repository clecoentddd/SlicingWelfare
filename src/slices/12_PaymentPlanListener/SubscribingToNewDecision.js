// src/slices/12_PaymentPlanListener/SubscribePaymentPlan.js
import { eventEmitter } from '../shared/eventEmitter';
import { appendEvent } from '../../eventStore/eventRepository';
import { DecisionApprovedForPaymentReconciliationHandler } from '../13_CreatePaymentPlan/CreatePaymentPlanHandler.js';

export function subscribeToPaymentPlanEvents() {
  console.log('Subscriber: Setting up event listener for DecisionApprovedForPaymentReconciliation');

  eventEmitter.on('DecisionApprovedForPaymentReconciliation', async (event) => {
    try {
      console.log("Subscriber: Event received in subscriber:", event);

      console.log('Subscriber: Storing received event in EventDB - calling Command', event);
      await DecisionApprovedForPaymentReconciliationHandler(event);

      console.log("Subscriber: Processing event completed with sucess:", event);
      // Add your logic here to handle the event, e.g., build the payment plan
    } catch (error) {
      console.error("Subscriber: Error handling received event:", error);
    }
  });

  console.log("Subscribed to payment plan events. Waiting for events to be emitted...");
}
