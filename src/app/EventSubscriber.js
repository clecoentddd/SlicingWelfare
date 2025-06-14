// src/app/EventSubscriber.jsx
"use client";

import { useEffect } from 'react';
import { subscribeToNewDecision } from '../slices/12_PaymentPlanListener/SubscribeToDecision';
import { subscribeToResourcesPushed } from '../slices/06_CalculationProcessor/SubscribeDomainEventResourcesPushed';
import { subscribeToPaymentProcessed } from '../slices/16_PaymentPlanProcessedProjection/SubscribeToPaymentProcessed';
import { subscribeToDecisionProjectionWithExisintPaymentPlan } from '../slices/19_DecisionWithExistingPaymentPlanProjection/subscribeToDecisionProjectionWithExisintPaymentPlan';
import { subscribeToIntegrationEventDecisionWithExisintPayementPlanApproved } from '../slices/19_DecisionWithExistingPaymentPlanProjection/subscribeToIntegrationEventDecisionWithExisingPaymentPlan';
import { subscribePaymentPlanPreparedInReplacement } from '../slices/21_projectUpdatedPaymentPlan/subScribeToUpdatedPaymentPlan';

export default function EventSubscriber() {
  useEffect(() => {
    console.log('EventSubscriber: Initializing integration event subscribers...');

    // Subscribe to decision events
    subscribeToNewDecision();

    // Subscribe to DataPushed domain events
    subscribeToResourcesPushed();

    //
    subscribeToIntegrationEventDecisionWithExisintPayementPlanApproved();

    // Domain Events:
    console.log('EventSubscriber: Initializing domain event subscribers...');

    // Subscribe to domain events
    subscribeToPaymentProcessed();

    // Subscribe to decision projection with existing payment plan
    subscribeToDecisionProjectionWithExisintPaymentPlan();

    // Projection subscription for new payment plan when there is an existing payment plan
    subscribePaymentPlanPreparedInReplacement();

    console.log('Subscribed to all necessary events.');
  }, []);

  return null; // This component does not render anything
}
