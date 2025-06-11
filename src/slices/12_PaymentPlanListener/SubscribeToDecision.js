// src/slices/12_PaymentPlanListener/SubscribePaymentPlan.js

import { integrationEventEmitter } from '../shared/eventEmitter';
import { createPaymentPlanHandler } from '../13_CreatePaymentPlan/CreatePaymentPlanHandler';

export function subscribeToNewDecision() {
  console.log('Subscriber: Setting up event listener for DecisionApprovedForPaymentReconciliation');

  integrationEventEmitter.subscribe('DecisionApprovedForPaymentReconciliation', async (event) => {
    try {
      console.log("Subscriber: Event received:", event);
      await createPaymentPlanHandler(event);
    } catch (error) {
      console.error("Subscriber: Error handling event:", error);
    }
  });

  console.log("Subscribed to DecisionApprovedForPaymentReconciliation events.");
}
