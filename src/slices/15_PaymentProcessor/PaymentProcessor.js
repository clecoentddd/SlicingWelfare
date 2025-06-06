import { appendEvent } from '../../eventStore/eventRepository';
import { v4 as uuidv4 } from 'uuid';

export async function processPayments(paymentPlan) {
  const currentDate = new Date();
  const processedPayments = [];

  for (const [month, details] of Object.entries(paymentPlan.payments)) {
    const paymentDate = new Date(details.Date);

    if (details.Date === 'Immediate' || isSameDay(paymentDate, currentDate)) {
      const paymentId = uuidv4(); // Generate a unique paymentId for each payment
      const paymentEvent = {
        type: "PaymentProcessed",
        paymentId: paymentId,
        timestamp: Date.now(),
        payload: {
          month,
          amount: details.Payment,
          paymentDate: details.Date,
        },
      };

      await appendEvent(paymentEvent);
      processedPayments.push(paymentEvent);
    }
  }

  return processedPayments;
}

function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
