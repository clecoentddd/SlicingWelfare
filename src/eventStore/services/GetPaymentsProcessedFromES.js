// src/services/paymentReplayService.js

import { getAllEvents } from '../eventRepository.js';

export async function fetchLatestPaymentsFromReplay() {
  console.log("[PaymentReplayService] Starting replay of payment plan events to find latest payment plan ID.");

  const allEvents = await getAllEvents();
  let latestPlanEvent = null;
  const payments = [];

  // Include both original and replacement plan types
  const planPreparedEvents = allEvents.filter(
    event =>
      event.type === "PaymentPlanPrepared" ||
      event.type === "PaymentPlanPreparedInReplacement"
  );

  console.log(`[PaymentReplayService] Found ${planPreparedEvents.length} plan preparation events.`);

  // Find the latest plan event based on timestamp
  planPreparedEvents.forEach(event => {
    if (!latestPlanEvent || new Date(event.timestamp) > new Date(latestPlanEvent.timestamp)) {
      latestPlanEvent = event;
    }
  });

  console.log("[PaymentReplayService] Latest plan event:", latestPlanEvent ? latestPlanEvent.paymentPlanId : "None");

  // Also gather all PaymentProcessed events
  const paymentProcessedEvents = allEvents.filter(event => event.type === "PaymentProcessed");

  paymentProcessedEvents.forEach(event => {
    const { month, amount } = event.payload;
    if (month && typeof amount === 'number') {
      payments.push({
        month,
        amount,
        status: 'PaymentProcessed',
        paymentPlanId: event.paymentPlanId || null, // If available in the event
      });
    } else {
      console.warn("[PaymentReplayService] Skipping malformed PaymentProcessed event:", event);
    }
  });

  console.log("[PaymentReplayService] Replay complete. Total processed payments:", payments.length);

  return {
    latestPaymentPlanId: latestPlanEvent ? latestPlanEvent.paymentPlanId : null,
    payments
  };
}


