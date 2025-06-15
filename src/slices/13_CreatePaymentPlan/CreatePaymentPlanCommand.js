import { v4 as uuidv4 } from 'uuid';
import { getLatestPaymentPlan } from '../shared/openPaymentPlanDB';
import { appendEvent } from '../../eventStore/eventRepository';

export async function preparePaymentPlan(monthlyCalculations, previousPaymentId, decisionId) {
  // Retrieve the latest payment plan to verify the previousPaymentId
  const latestPaymentPlan = await getLatestPaymentPlan();

  if (latestPaymentPlan && latestPaymentPlan.paymentPlanId !== previousPaymentId) {
    const rejectionMessage = `The payment plan used for reference by the decision is incorrect. Latest Payment Plan ID is ${latestPaymentPlan.paymentPlanId}, but the provided ID is ${previousPaymentId}.`;

    // Alert the user with a detailed message
    alert(rejectionMessage);

    // Create and handle the rejection event
    const rejectionEvent = {
      type: "DecisionValidationRejected",
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      aggregate: "PaymentPlan",
      payload: {
        decisionId: decisionId,
        message: rejectionMessage,
      },
    };

    // Here you might have additional logic to handle or log the rejectionEvent
    console.log(rejectionEvent); // Placeholder for actual handling logic
    return rejectionEvent;  // Assuming you may want to return it
  }

  // Process payments and structure them as an array of objects
  const formattedPayments = Object.entries(monthlyCalculations).map(([month, amount]) => {
    return {
      month,
      paymentId: uuidv4(), // Generate a unique paymentId for each payment
      amount,
      status: 'PaymentToProcess' // Initial status
    };
  });

  // Return the PaymentPlanPrepared event with formatted payments
  return {
    type: "PaymentPlanPrepared",
    paymentPlanId: uuidv4(),
    decisionId: decisionId,
    timestamp: Date.now(),
    aggregate: "PaymentPlan",
    payload: {
      previousPaymentId,
      payments: formattedPayments, // Use the directly mapped array
    },
    eventId: uuidv4(), // Include an event ID
  };
}
