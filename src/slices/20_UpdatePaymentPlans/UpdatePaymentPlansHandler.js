// src/slices/ChangeState/ChangeStateHandler.js

import { updatePaymentPlansCommand } from './UpdatePaymentPlansCommand';
import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';



export async function UpdatePaymentPlansHandler(event) {
  try {
    const { paymentPlanId, decisionId, calculationId, calculations } = event.payload;

    console.log(`Processing payments for paymentPlanId: ${paymentPlanId} with decisionId: ${decisionId} based on calculationId: ${calculationId}`);

    // Call the command to process payments and create events
    const { paymentPlanReplacedEvent, newPaymentEvents, paymentPlanPreparedEvent } = await updatePaymentPlansCommand(decisionId, calculationId, paymentPlanId);

    // Append the PaymentPlanReplaced event
    await appendEvent(paymentPlanReplacedEvent);

    // Append the PaymentPlanPrepared event
    await appendEvent(paymentPlanPreparedEvent);

    console.log('Payment plan events stored successfully.');
  } catch (error) {
    console.error("Error in changeStateHandler:", error);
    throw error;
  }
}