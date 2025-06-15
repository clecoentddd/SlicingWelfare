// src/slices/ChangeState/ChangeStateHandler.js

import { updatePaymentPlansCommand } from './UpdatePaymentPlansCommand';
import { v4 as uuidv4 } from 'uuid';
import { appendEvent } from '../../eventStore/eventRepository';
import { domainEventEmitter } from '../shared/eventEmitter';



export async function UpdatePaymentPlansHandler(event) {
  try {

    console.log("UpdatePaymentPlansHandler: event received is", event);

    const { paymentPlanId, calculationId, calculations } = event.payload;
    const decisionId = event.decisionId;

    console.log(`Processing payments for paymentPlanId: ${paymentPlanId} with decisionId: ${decisionId} based on calculationId: ${calculationId}`);

    // Call the command to process payments and create events
    const { paymentPlanReplacedEvent, paymentPlanPreparedEvent } = await updatePaymentPlansCommand(decisionId, calculationId, paymentPlanId);

    // Append the PaymentPlanReplaced event
    await appendEvent(paymentPlanReplacedEvent);

    // Append the PaymentPlanPrepared event
    await appendEvent(paymentPlanPreparedEvent);
      console.log('Payment plan events stored successfully.');

    // Publish domain event for projection
    domainEventEmitter.publish('PaymentPlanPreparedInReplacement', paymentPlanPreparedEvent);
    console.log('UpdatePaymentPlansHandler: Published domain event PaymentPlanPreparedInReplacement');
    


  } catch (error) {
    console.error("Error in changeStateHandler:", error);
    throw error;
  }
}