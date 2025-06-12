// src/slices/IntegrationEventSubscriber/SubscribeToIntegrationEventDecisionApproved.js

import { integrationEventEmitter } from '../shared/eventEmitter';
import { UpdatePaymentPlansHandler } from '../20_UpdatePaymentPlans/UpdatePaymentPlansHandler';

export function subscribeToIntegrationEventDecisionWithExisintPayementPlanApproved() {
  integrationEventEmitter.subscribe('DecisionCalculationValidatedWithExistingPaymentPlan', (event) => {
    try {
      console.log('Received integration event DecisionCalculationValidatedWithExistingPaymentPlan:', event);
      UpdatePaymentPlansHandler(event);
    } catch (error) {
      console.error("Error handling integration event DecisionCalculationValidatedWithExistingPaymentPlan:", error);
    }
  });

  console.log('Subscriber for integration event DecisionCalculationValidatedWithExistingPaymentPlan is set up.');
}
