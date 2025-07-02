// src/app/EventSubscriber.jsx
"use client";

import { useEffect } from 'react';
import { subscribeToNewDecision } from '../slices/12_PaymentPlanListener/SubscribeToDecision';
import { subscribeToIntegrationEventResourcesPushed } from '../slices/06_CalculationProcessor/SubscribeIntegrationEventResourcesPushed';
import { subscribeToTransactionProcessed } from '../slices/16_PaymentPlanProcessedProjection/SubscribeToTransactionProcessed';
import { subscribeToDecisionProjectionWithExisintPaymentPlan } from '../slices/19_DecisionWithExistingPaymentPlanProjection/subscribeToDecisionProjectionWithExisintPaymentPlan';
import { subscribeToIntegrationEventDecisionWithExisintPayementPlanApproved } from '../slices/19_DecisionWithExistingPaymentPlanProjection/subscribeToIntegrationEventDecisionWithExisingPaymentPlan';
import { subscribePaymentPlanPreparedInReplacement } from '../slices/21_projectUpdatedPaymentPlan/subScribeToUpdatedPaymentPlan';
import {subscribeToDomainEventDataPushed} from '../slices/05_updateChangesToPushedInProjection/subscribeToDomainEventDataPushed'
import {subscribeToDomainEventDataCancelled} from '../slices/23_UpateResourcesProjectionWithCancellingCommittedEntries/subscribeToDomainEventDataCancelled';
import { subscribeBigBook } from '../slices/24_TheBigBook/BigBookSubscriber.js';
import { subscribeToDomainEventNewDecisionWithPayments } from '../slices/10_DecisionProjection/subscriberToDecision';

export default function EventSubscriber() {
  useEffect(() => {
    console.log('EventSubscriber: Initializing integration event subscribers...');

    // Subscribe to decision events
    subscribeToNewDecision();

    // Subscribe to DataPushed domain events
    subscribeToDomainEventDataPushed();

    // Subscribe to DataCancelled domain events
    subscribeToDomainEventDataCancelled();

    // Data Pushed Integration:
    subscribeToIntegrationEventResourcesPushed();

    subscribeToIntegrationEventDecisionWithExisintPayementPlanApproved();

    // Domain Events:
    console.log('EventSubscriber: Initializing domain event subscribers...');

    // Subscribe to domain events
    subscribeToTransactionProcessed();

    // Decisions with payments, no payment exists
    subscribeToDomainEventNewDecisionWithPayments();

    // Subscribe to decision projection with existing payment plan
    subscribeToDecisionProjectionWithExisintPaymentPlan();

    // Projection subscription for new payment plan when there is an existing payment plan
    subscribePaymentPlanPreparedInReplacement();

    subscribeBigBook();

    console.log('Subscribed to all necessary events.');
  }, []);

  return null; // This component does not render anything
}
