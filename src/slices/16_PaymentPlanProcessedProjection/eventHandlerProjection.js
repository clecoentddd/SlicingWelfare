import { setPaymentIdToProcessed } from '../shared/openPaymentPlanDB';

export const handleProcessedEventForProjection = async (event) => {
  console.log('*********** Processing event:', event);

  try {
    // Log detailed information about the event
    console.log(`Processing payment with ID: ${event.paymentId}`);
    console.log(`Payment amount: ${event.payload.amount}`);
    console.log(`Payment month: ${event.payload.month}`);
    console.log(`Payment status: ${event.type}`);
    console.log(`Payment timestamp: ${event.timestamp}`);

    // Update the payment status and timestamp in the database
    const success = await setPaymentIdToProcessed(event.paymentId, event.type, event.timestamp);
    if (success) {
      console.log(`Payment with ID ${event.paymentId} has been successfully updated.`);
    } else {
      console.error(`Failed to update payment with ID ${event.paymentId}.`);
    }
  } catch (error) {
    console.error('Error handling TransactionProcessed event:', error);
  }
};
