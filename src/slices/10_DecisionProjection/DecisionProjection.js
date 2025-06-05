import { openDecisionDB, addToStore } from "../shared/openDecisionDB.js";


export async function addEventToDecisionProjection(storedEvent) {
  try {
    const decisionDb = await openDecisionDB();
    const decisionTx = decisionDb.transaction("decisions", "readwrite");
    const decisionStore = decisionTx.objectStore("decisions");

    // Map the event data to the DecisionDB structure
    const decisionEntry = {
      decisionId: storedEvent.decisionId, // Use decisionId as the primary key
      calculationId: storedEvent.payload.calculationId,
      changeId: storedEvent.payload.changeId,
      timestamp: storedEvent.timestamp,
      status: storedEvent.type === "DecisionCalculationValidated" ? storedEvent.type : "Unknown"  // Map type to status
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
