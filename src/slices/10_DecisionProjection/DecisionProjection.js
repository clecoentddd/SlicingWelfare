// src/slices/09_DecisionProjection/DecisionProjection.js

import { getEventDB } from "../../eventStore/eventDb"
import {  getAllFromStore } from "../shared/openDecisionDB.js";
import { openDecisionDB, addToStore } from "../shared/openDecisionDB.js";

export async function projectDecisionEvents() {
  try {
    const eventDb = await getEventDB();
    const eventTx = eventDb.transaction("events", "readonly");
    const eventStore = eventTx.objectStore("events");
    const events = await getAllFromStore(eventStore);

    const decisionDb = await openDecisionDB();
    const decisionTx = decisionDb.transaction("decisions", "readwrite");
    const decisionStore = decisionTx.objectStore("decisions");

    // Process each event
    for (const event of events) {
      if (event.type === "CalculationPerformed" || event.type === "DecisionCalculationValidated") {
        await handleEvent(event, decisionStore);
      }
    }

    console.log('Projection of decision events completed successfully.');
  } catch (error) {
    console.error("Error projecting decision events:", error);
  }
}

async function handleEvent(event, decisionStore) {
  if (event.type === "CalculationPerformed") {
    const { changeId, monthlyCalculations } = event.payload;

    // Create a decision entry for each CalculationPerformed event
    const decisionEntry = {
      id: event.id,
      changeId,
      calculationId: null, // Initially null, will be updated if a decision is made
      monthlyCalculations,
      decisionTaken: false,
      decisionId: null,
      type: event.type,
      timestamp: event.timestamp
    };

    await addToStore(decisionStore, decisionEntry);
  } else if (event.type === "DecisionCalculationValidated") {
    const { calculationId, changeId, decisionId } = event.payload;

    // Find the corresponding CalculationPerformed entry and update it
    const existingEntry = await decisionStore.getAll();
    const entryToUpdate = existingEntry.find(entry =>
      entry.changeId === changeId &&
      entry.type === "CalculationPerformed" &&
      !entry.decisionTaken
    );

    if (entryToUpdate) {
      entryToUpdate.decisionTaken = true;
      entryToUpdate.decisionId = decisionId;
      entryToUpdate.calculationId = calculationId;

      // Update the entry in the decision store
      await decisionStore.put(entryToUpdate);
    }
  }
}
