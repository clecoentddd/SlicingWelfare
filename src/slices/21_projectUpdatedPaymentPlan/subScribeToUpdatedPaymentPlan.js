import { domainEventEmitter } from '../shared/eventEmitter.js';
import { handleToBeProcessedEventForProjection } from '../14_PaymentPlanProjection/PaymentPlanToBeProcessedProjection.js';

export function subscribePaymentPlanPreparedInReplacement() {
  domainEventEmitter.subscribe('PaymentPlanPreparedInReplacement', async (paymentPlanEvent) => {
    try {
      console.log('Received domain event PaymentPlanPreparedInReplacement', paymentPlanEvent);
        await handleToBeProcessedEventForProjection(paymentPlanEvent);
    } catch (error) {
      console.error("Error handling domain event PaymentPlanPreparedInReplacement:", error);
    }
  });

  console.log('Subscriber for PaymentPlanPreparedInReplacement is set up.');
}