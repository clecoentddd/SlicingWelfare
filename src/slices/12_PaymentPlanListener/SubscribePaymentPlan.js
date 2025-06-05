// src/slices/12_PaymentPlanListener/SubscribePaymentPlan.js

import { openEventDB, getAllFromStore } from '../../eventStore/eventRepository';

export async function subscribeToPaymentPlanEvents() {
  try {
    const eventDb = await openEventDB();
    const eventTx = eventDb.transaction("events", "readonly");
    const eventStore = eventTx.objectStore("events");
    const events = await getAllFromStore(eventStore);

    // Filter and process DecisionApprovedForPaymentReconciliation events
    events.forEach(event => {
      if (event.type === "DecisionApprovedForPaymentReconciliation") {
        console.log("Received DecisionApprovedForPaymentReconciliation event:", event);
        // Add your logic here to handle the event, e.g., build the payment plan
      }
    });
  } catch (error) {
    console.error("Error subscribing to payment plan events:", error);
  }
}
