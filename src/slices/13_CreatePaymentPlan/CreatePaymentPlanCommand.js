import { v4 as uuidv4 } from 'uuid';
import { getLatestPaymentPlan } from '../shared/openPaymentPlanDB';
import { appendEvent } from '../../eventStore/eventRepository';

export async function preparePaymentPlan(monthlyCalculations, previousPaymentId, decisionId) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Months are zero-based
  const currentYear = currentDate.getFullYear();

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
}

  // Process payments and structure them as an array of objects
  const formattedPayments = Object.entries(monthlyCalculations).map(([month, amount]) => {
    const [monthNum, year] = month.split('-').map(Number);
    const paymentDate = new Date(year, monthNum - 1, 1); // Month is zero-based

    // If the payment month is before the current month and year, set payment date to immediate
    if (year < currentYear || (year === currentYear && monthNum < currentMonth)) {
      return {
        month,
        paymentId: uuidv4(), // Generate a unique paymentId for each payment
        amount,
        paymentDate: 'Immediate',
        status: 'PaymentToProcess' // Initial status
      };
    } else {
      // Set payment date to the end of the month
      paymentDate.setMonth(paymentDate.getMonth() + 1);
      paymentDate.setDate(0); // Set to the last day of the month
      const formattedDate = paymentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      return {
        month,
        paymentId: uuidv4(), // Generate a unique paymentId for each payment
        amount,
        paymentDate: formattedDate,
        status: 'PaymentToProcess' // Initial status
      };
    }
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
