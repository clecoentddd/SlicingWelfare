import { openPaymentPlanDB } from '../shared/openPaymentPlanDB';

export async function handlePaymentPlanEventForProjection(event) {
  const db = await openPaymentPlanDB();
  const tx = db.transaction("paymentPlans", "readwrite");
  const store = tx.objectStore("paymentPlans");

  switch (event.type) {
    case "PaymentPlanPrepared":
      await store.put({
        paymentPlanId: event.paymentPlanId,
        decisionId: event.decisionId,
        previousPaymentId: event.payload.previousPaymentId,
        payments: event.payload.payments,
        timestamp: event.timestamp
      });
      break;
    // Add more event types as needed
    default:
      console.warn(`Unknown event type: ${event.type}`);
  }

  await tx.done;
  console.log(`Processed event ${event.type} with eventId: ${event.eventId}`);
}

export async function getLatestPaymentPlan() {
  const db = await openPaymentPlanDB();
  const tx = db.transaction("paymentPlans", "readonly");
  const store = tx.objectStore("paymentPlans");

  const request = store.openCursor(null, 'prev');
  return new Promise((resolve) => {
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(null);
      }
    };
  });
}
