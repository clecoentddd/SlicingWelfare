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
    const rejectionEvent = {
      type: "DecisionValidationRejected",
      eventId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Decision",
      payload: {
        decisionId: decisionId,
        message: "The payment plan used for reference by the decision is incorrect",
      },
    };

    console.log('Storing rejection event in EventDB:', rejectionEvent);
    await appendEvent(rejectionEvent);
    console.log(`Rejection event ${rejectionEvent.type} stored with eventId: ${rejectionEvent.eventId}`);

    return rejectionEvent;
  }

  const payments = Object.entries(monthlyCalculations).map(([month, amount]) => {
    const [monthNum, year] = month.split('-').map(Number);
    const paymentDate = new Date(year, monthNum - 1, 1); // Month is zero-based

    // If the payment month is before the current month and year, set payment date to immediate
    if (year < currentYear || (year === currentYear && monthNum < currentMonth)) {
      return {
        paymentId: uuidv4(), // Generate a unique paymentId for each payment
        month,
        amount,
        paymentDate: 'Immediate',
        status: 'PaymentToBeProcessed' // Initial status
      };
    } else {
      // Set payment date to the end of the month
      paymentDate.setMonth(paymentDate.getMonth() + 1);
      paymentDate.setDate(0); // Set to the last day of the month
      const formattedDate = paymentDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      return {
        paymentId: uuidv4(), // Generate a unique paymentId for each payment
        month,
        amount,
        paymentDate: formattedDate,
        status: 'PaymentToBeProcessed' // Initial status
      };
    }
  });

  // Transform the payments array into the desired object structure
  const formattedPayments = payments.reduce((acc, payment) => {
    acc[payment.month] = {
      paymentId: payment.paymentId,
      Payment: payment.amount,
      Date: payment.paymentDate,
      Status: payment.status
    };
    return acc;
  }, {});

  return {
    type: "PaymentPlanPrepared",
    paymentPlanId: uuidv4(),
    decisionId: decisionId,
    timestamp: Date.now(),
    aggregate: "Payment",
    payload: {
      previousPaymentId,
      payments: formattedPayments,
    },
  };
}