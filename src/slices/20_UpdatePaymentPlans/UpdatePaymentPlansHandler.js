// src/slices/ChangeState/ChangeStateHandler.js

import { updatePaymentPlansCommand } from './UpdatePaymentPlansCommand';
import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';
import { domainEventEmitter } from '../shared/eventEmitter';



export async function UpdatePaymentPlansHandler(event) {
  try {
    console.log("UpdatePaymentPlansHandler: event received is", event);

    const { paymentPlanId, calculationId } = event.payload;
    const decisionId = event.decisionId;

    console.log(`Processing payments for paymentPlanId: ${paymentPlanId} with decisionId: ${decisionId} based on calculationId: ${calculationId}`);

    // Safely destructure result
    const result = await updatePaymentPlansCommand(decisionId, calculationId, paymentPlanId);

    const paymentPlanReplacedEvent = result?.paymentPlanReplacedEvent;
    const paymentPlanPreparedEvent = result?.paymentPlanPreparedEvent;

    // If both are null, no events to handle
    if (!paymentPlanReplacedEvent && !paymentPlanPreparedEvent) {
      console.log("✅ No payment plan events to emit. Skipping.");
      return;
    }

    // Proceed only if both events exist (or you can handle partials if needed)
    if (paymentPlanReplacedEvent) {
      await appendEvent(paymentPlanReplacedEvent);
    }

    if (paymentPlanPreparedEvent) {
      await appendEvent(paymentPlanPreparedEvent);
      domainEventEmitter.publish('PaymentPlanPreparedInReplacement', paymentPlanPreparedEvent);
      console.log('✅ Domain event PaymentPlanPreparedInReplacement published');
    }

    console.log('✅ Payment plan update events handled successfully.');

  } catch (error) {
    console.error("❌ Error in UpdatePaymentPlansHandler:", error);
    throw error;
  }
}
