// src/services/paymentReplayService.js

import { getAllEvents } from '../eventRepository.js';

export async function replayPaymentProcessedEvents() {
  console.log("[PaymentReplayService] Starting replay of PaymentPlanPrepared events to find latest payment plan ID.");

  const allEvents = await getAllEvents();
  let latestPlanEvent = null;
  const payments = [];

  // Filter for "PaymentPlanPrepared" events to get the latest paymentPlanId
  const paymentPlanPreparedEvents = allEvents.filter(
    event => event.type === "PaymentPlanPrepared"
  );

  console.log(`[PaymentReplayService] Found ${paymentPlanPreparedEvents.length} PaymentPlanPrepared events.`);

  paymentPlanPreparedEvents.forEach(event => {
    const timestamp = event.timestamp;

    // Check if this event is the latest so far
    if (!latestPlanEvent || new Date(timestamp) > new Date(latestPlanEvent.timestamp)) {
      latestPlanEvent = event;
    }
  });

  console.log("[PaymentReplayService] Latest PaymentPlanPrepared event:", latestPlanEvent ? latestPlanEvent.paymentPlanId : "None");

  // Process PaymentProcessed events to get the list of payments
  const paymentProcessedEvents = allEvents.filter(
    event => event.type === "PaymentProcessed"
  );

  paymentProcessedEvents.forEach(event => {
    const { month, amount } = event.payload;

    if (month && typeof amount === 'number') {
      payments.push({
        month,
        amount,
        status: 'PaymentProcessed' // Assuming the status for processed payments
      });
    } else {
      console.warn(`[PaymentReplayService] Skipping malformed PaymentProcessed event:`, event);
    }
  });

  console.log("[PaymentReplayService] Replay complete. Total payments processed:", payments.length);

  // Return in the format of { latestPaymentPlanId, payments }
  return {
    latestPaymentPlanId: latestPlanEvent ? latestPlanEvent.paymentPlanId : null,
    payments: payments
  };
}

