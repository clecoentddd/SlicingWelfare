import { openPaymentPlanDB } from '../shared/openPaymentPlanDB';

export async function handleToBeProcessedEventForProjection(event) {
  console.log('Starting to handle event:', event.type);

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
      case "PaymentPlanPreparedInReplacement":
        console.log('Processing PaymentPlanPrepared event.', event.type);

        // Iterate over each month in the payload
        const payments = Object.entries(event.payload.payments).map(([month, details]) => {
          console.log(`Processing payment to process for month: ${details.month} ${details.paymentId} ${details.amount}`);
          return {
            paymentPlanId: event.paymentPlanId,
            decisionId: event.decisionId,
            previousPaymentId: event.payload.previousPaymentId,
            paymentId: details.paymentId, // Ensure this is unique
            month: details.month,
            amount: details.amount,
            date: details.month,
            status: details.status,
            timestamp: event.timestamp
          };
        });

        // Store each payment as a separate record
        for (const payment of payments) {
          console.log(`Storing payment with ID: ${payment.paymentId}`);
          await store.put(payment);
        }
        break;

      default:
        console.warn(`Unknown event type: ${event.type}`);
    }

    await tx.done;
    console.log(`Transaction completed for event ${event.type} with paymentPlanId: ${event.paymentPlanId}`);

    // Read back all records from the database to verify
    const readTx = db.transaction("paymentPlans", "readonly");
    const readStore = readTx.objectStore("paymentPlans");
    const getAllRequest = readStore.getAll();

    getAllRequest.onsuccess = () => {
      const allRecords = getAllRequest.result;
      console.log('All records in the database:', allRecords);
    };

    await readTx.done;
    console.log('Read transaction completed.');

  } catch (error) {
    console.error('Failed to execute transaction:', error);
    tx.abort();
    console.log('Transaction aborted due to error.');
  } finally {
    if (db) {
      db.close();
      console.log('Database connection closed.');
    }
  }
}
