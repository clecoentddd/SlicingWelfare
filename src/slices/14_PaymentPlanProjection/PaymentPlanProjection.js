import { openPaymentPlanDB, getLatestPaymentPlan } from '../shared/openPaymentPlanDB';

export async function handlePaymentPlanEventForProjection(event) {
  let db;
  try {
    db = await openPaymentPlanDB();
  } catch (error) {
    console.error('Failed to open database:', error);
    return;
  }

  const tx = db.transaction("paymentPlans", "readwrite");
  const store = tx.objectStore("paymentPlans");

  try {
    switch (event.type) {
      case "PaymentPlanPrepared":
        // Transform the payments to ensure they are stored correctly
        const payments = Object.entries(event.payload.payments).reduce((acc, [month, details]) => {
          acc[month] = {
            paymentId: details.paymentId,
            Payment: details.Payment,
            Date: details.Date,
            Status: details.Status
          };
          return acc;
        }, {});

        await store.put({
          paymentPlanId: event.paymentPlanId,
          decisionId: event.decisionId,
          previousPaymentId: event.payload.previousPaymentId,
          payments: payments,
          timestamp: event.timestamp
        });
        break;

      case "PaymentProcessed":
        const existingPlan = await store.get(event.payload.paymentPlanId);
        if (existingPlan) {
          const month = event.payload.month;
          if (existingPlan.payments && existingPlan.payments[month]) {
            existingPlan.payments[month].Status = "Processed";
            existingPlan.payments[month].paymentDate = new Date().toISOString();
            await store.put(existingPlan);
          }
        }
        break;

      default:
        console.warn(`Unknown event type: ${event.type}`);
    }

    await tx.done;
    console.log(`Processed event ${event.type} with paymentPlanId: ${event.paymentPlanId}`);
  } catch (error) {
    console.error('Failed to execute transaction:', error);
    tx.abort();
  } finally {
    if (db) {
      db.close();
    }
  }
}
