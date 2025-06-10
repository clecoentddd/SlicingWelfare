import { preparePaymentPlan } from './CreatePaymentPlanCommand.js';
import { appendEvent } from '../../eventStore/eventRepository';
import { handlePaymentPlanEventForProjection } from '../14_PaymentPlanProjection/PaymentPlanProjection.js';

export async function createPaymentPlanHandler(domainEvent) {
  try {
    console.log('Handling domain event:', domainEvent);

    const { previousPaymentId, payments, decisionId } = domainEvent.payload;

    // Prepare the payment plan
    const event = await preparePaymentPlan(payments, previousPaymentId, decisionId);

    if (event.type === "DecisionValidationRejected") {
      console.log('Decision validation rejected:', event);
      return event;
    }

    console.log('Prepared payment plan event:', event);

    // Store the payment plan event in EventDB
    console.log('Storing payment plan event in EventDB:', event);
    await appendEvent(event);
    console.log(`Payment plan event ${event.type} stored with eventId: ${event.eventId}`);

    // Handle the event for projection
    await handlePaymentPlanEventForProjection(event);

    console.log(`Handler: Payment plan event ${event.type} stored with eventId: ${event.eventId}`);


    return event;
  } catch (error) {
    console.error("Error handling domain event:", error);
    throw error;
  }
}