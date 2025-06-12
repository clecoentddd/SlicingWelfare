import { openDecisionDB, addToStore } from "../shared/openDecisionDB.js";

export async function addEventToDecisionProjection(storedEvent) {
  try {
    const decisionDb = await openDecisionDB();
    const decisionTx = decisionDb.transaction("decisions", "readwrite");
    const decisionStore = decisionTx.objectStore("decisions");

    // Determine if paymentPlanId exists and set the appropriate fields
    const hasPaymentPlanId = storedEvent.paymentPlanId !== undefined;
    const paymentPlanId = hasPaymentPlanId ? storedEvent.paymentPlanId : null;

        // Determine the status based on the event type
    let status;
    if (storedEvent.type === "DecisionCalculationValidated" || storedEvent.type === "DecisionCalculationValidatedWithExistingPaymentPlan") {
      status = storedEvent.type;
    } else {
      status = "Unknown";
    }

    // Map the event data to the DecisionDB structure
    const decisionEntry = {
      decisionId: storedEvent.decisionId, // Use decisionId as the primary key
      calculationId: storedEvent.payload.calculationId,
      changeId: storedEvent.payload.changeId,
      timestamp: storedEvent.timestamp,
      status: status,
      hasPaymentPlanId: hasPaymentPlanId, // Add field indicating if paymentPlanId exists
      paymentPlanId: paymentPlanId // Add the paymentPlanId if it exists
    };

    // Store the mapped data in the decision store
    await addToStore(decisionStore, decisionEntry);

    // Complete the transaction
    await decisionTx.done;

    console.log('Decision projection stored successfully.');
  } catch (error) {
    console.error("Error storing decision projection:", error);
    throw error;
  }
}
