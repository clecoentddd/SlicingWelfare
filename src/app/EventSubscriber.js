// src/app/EventSubscriber.jsx
"use client";

import { useEffect } from 'react';
import { subscribeToPaymentPlanEvents } from '../slices/12_PaymentPlanListener/SubscribingToNewDecision';
import { subscribeToResourcesPushed } from '../slices/06_CalculationProcessor/SubscribeDomainEventResourcesPushed';

export default function EventSubscriber() {
  useEffect(() => {
    console.log('Initializing event subscribers...');

    // Subscribe to PaymentPlan events
    subscribeToPaymentPlanEvents();

    // Subscribe to DataPushed domain events
    subscribeToResourcesPushed();

    console.log('Subscribed to all necessary events.');
  }, []);

  return null; // This component does not render anything
}
