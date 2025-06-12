// src/slices/IntegrationEventSubscriber/SubscribeToIntegrationEventDecisionApproved.js

import { integrationEventEmitter } from '../shared/eventEmitter';

export function subscribeToIntegrationEventDecisionWithExisintPayementPlanApproved() {
  integrationEventEmitter.subscribe('DecisionCalculationValidatedWithExistingPaymentPlan', (event) => {
    try {
      console.log('Received integration event DecisionCalculationValidatedWithExistingPaymentPlan:', event);
      // Here you can add any additional logic to handle the integration event
    } catch (error) {
      console.error("Error handling integration event DecisionCalculationValidatedWithExistingPaymentPlan:", error);
    }
  });

  console.log('Subscriber for integration event DecisionCalculationValidatedWithExistingPaymentPlan is set up.');
}
