import { getEventDB } from "../../eventStore/eventDb";
import { getAllFromStore } from "../shared/openDecisionDB.js";
import { openDecisionDB } from "../shared/openDecisionDB.js";
import { addEventToDecisionProjection } from "./DecisionProjection.js"; // Import the refactored function

async function clearDecisionProjection() {
  try {
    const decisionDb = await openDecisionDB();
    const decisionTx = decisionDb.transaction("decisions", "readwrite");
    const decisionStore = decisionTx.objectStore("decisions");

    // Clear all existing entries in the decision store
    await decisionStore.clear();
    console.log('Cleared all existing entries from the decision projection.');
  } catch (error) {
    console.error("Error clearing decision projection:", error);
    throw error;
  }
}

export async function rebuildProjection() {
  try {
    // Step 1: Clear the existing projection
    await clearDecisionProjection();

    // Step 2: Fetch all events from the event store
    const eventDb = await getEventDB();
    const eventTx = eventDb.transaction("events", "readonly");
    const eventStore = eventTx.objectStore("events");
    const events = await getAllFromStore(eventStore);

    console.log('Fetched all events from the event store. Starting projection rebuild...');

    // Step 3: Replay events to rebuild the projection
    for (const event of events) {
      if (event.type === "CalculationPerformed" || event.type === "DecisionCalculationValidated") {
        await addEventToDecisionProjection(event);
      }
    }

    console.log('Projection rebuild completed successfully.');
  } catch (error) {
    console.error("Error rebuilding projection:", error);
    throw error;
  }
}
