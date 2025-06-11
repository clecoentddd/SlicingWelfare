// src/app/EventSubscriber.jsx
"use client";

import { useEffect } from 'react';
import { subscribeToNewDecision } from '../slices/12_PaymentPlanListener/SubscribeToDecision';
import { subscribeToResourcesPushed } from '../slices/06_CalculationProcessor/SubscribeDomainEventResourcesPushed';
import { subscribeToPaymentProcessed } from '../slices/16_PaymentPlanProcessedProjection/SubscribeToPaymentProcessed';

export default function EventSubscriber() {
  useEffect(() => {
    console.log('EventSubscriber: Initializing integration event subscribers...');

    // Subscribe to decision events
    subscribeToNewDecision();

    // Subscribe to DataPushed domain events
    subscribeToResourcesPushed();

    // Domain Events:
    console.log('EventSubscriber: Initializing domain event subscribers...');

    // Subscribe to domain events
    subscribeToPaymentProcessed();

    console.log('Subscribed to all necessary events.');
  }, []);

  return null; // This component does not render anything
}
