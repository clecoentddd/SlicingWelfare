import { v4 as uuidv4 } from 'uuid';
import { getLatestPaymentPlan } from '../shared/openPaymentPlanDB';

export async function updatePaymentPlansCommand(paymentPlanId, decisionId, monthlyCalculations) {
  try {
    // Retrieve the latest payment plan from the database
    const latestPaymentPlan = await getLatestPaymentPlan();

    // If there's no latest payment plan or the IDs don't match, throw an error
    if (!latestPaymentPlan) {
      throw new Error('No latest payment plan found.');
    }

    // Check if the paymentPlanId matches the latest one
    if (latestPaymentPlan.paymentPlanId !== paymentPlanId) {
      throw new Error('The provided paymentPlanId does not match the latest payment plan.');
    }

    // Generate a new payment plan ID
    const newPaymentPlanId = uuidv4();

    // Create a PaymentPlanReplaced event
    const paymentPlanReplacedEvent = {
      type: 'PaymentPlanReplaced',
      paymentPlanId,
      aggregate: "PaymentPlan",
      decisionId,
      timestamp: new Date().toISOString(),
      payload: {
        oldPaymentPlanId: paymentPlanId,
        newPaymentPlanId,
        decisionId
      }
    };

    // Use reduce to build up the formatted payments array
    const formattedPayments = Object.entries(monthlyCalculations).reduce((acc, [month, calculation]) => {
      // Convert month number string to a formatted month string
      const monthNumber = parseInt(month, 10) + 1;  // Convert to 1-based index
      const formattedMonth = `${monthNumber.toString().padStart(2, '0')}-2025`;

      // Calculate the amount as calculationAmount - PaymentProcessed amount
      const calculatedAmount = calculation.calculationAmount - calculation.PaymentProcessedAmount;

      // Append the payment object to the accumulator array
      acc.push({
        month: formattedMonth,
        paymentId: uuidv4(),
        amount: calculatedAmount,
        date: "Immediate",
        status: 'PaymentToProcess'
      });
      return acc;
    }, []);  // Start with an empty array to use push()

    const paymentPlanPreparedEvent = {
      type: 'PaymentPlanPrepared',
      paymentPlanId: newPaymentPlanId,
      aggregate: "PaymentPlan",
      decisionId,
      timestamp: Date.now(), // Using a numeric timestamp similar to your example
      payload: {
        previousPaymentId: paymentPlanId,
        payments: formattedPayments // This is now an array of payment objects
      },
      eventId: uuidv4(), // Generating a unique eventId
    };

    // Return the events for further handling
    return {
      paymentPlanReplacedEvent,
      paymentPlanPreparedEvent
    };
  } catch (error) {
    console.error("Error processing payments:", error);
    throw error;
  }
}
