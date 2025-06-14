import { domainEventEmitter } from '../shared/eventEmitter.js';


export function subscribePaymentPlanPreparedInReplacement() {
  domainEventEmitter.subscribe('PaymentPlanPreparedInReplacement', async (paymentPlanEvent) => {
    try {
      console.log('Received domain event PaymentPlanPreparedInReplacement', paymentPlanEvent);
        await handleProcessedEventForProjection(paymentPlanEvent);
      console.log('PaymentPlanPreparedInReplacement projection TO BE IMPLEMENTED.');
    } catch (error) {
      console.error("Error handling domain event PaymentPlanPreparedInReplacement:", error);
    }
  });

  console.log('Subscriber for PaymentPlanPreparedInReplacement is set up.');
}