// src/slices/02_commitChanges/commitChangeCommand.js

import { v4 as uuidv4 } from 'uuid'; // For generating event IDs

/**
 * Represents the **commitChange command**.
 * This function encapsulates the business logic for deciding if a commit is allowed
 * and prepares the array of events to be appended to the event store.
 *
 * @param {Array<Object>} pendingEvents - The list of pending events (e.g., IncomeAdded, ExpenseAdded) to be committed.
 * @param {string} changeId - The ID of the change being committed.
 * @param {string} currentChangeStatus - The current status of the change aggregate (e.g., "Open", "Committed", "Pushed").
 * @returns {Promise<{success: true, preparedEvents: Array<Object>}|null>} A Promise that resolves to an object containing all prepared events on success, or to null if the commit is not allowed (after an alert).
 */
export async function commitChangeCommand(pendingEvents, changeId, currentChangeStatus) {
  console.log("Executing commitChangeCommand for changeId:", changeId, "status:", currentChangeStatus);

  // Business Rule: Check if the current status allows committing
  if (currentChangeStatus !== "Open" && currentChangeStatus !== "Committed") {
    alert(`Cannot commit changes. Change with ID ${changeId} has status "${currentChangeStatus}".`);
    return null; // Signal that the commit is not allowed
  }

  // Also check if there are actually pending events to commit
  if (pendingEvents.length === 0) {
      alert("No pending changes to commit.");
      return null; // Signal that the commit is not allowed
  }

  const preparedEvents = []; // This will hold all events to be appended by the handler

  // 1. Prepare each pending event for appending and ASSIGN AN EVENT ID HERE
  for (const event of pendingEvents) {
    const eventToAppend = {
      ...event,
      eventId: uuidv4(), // <--- FIX: Assign a UUID to eventId here!
    };
    preparedEvents.push(eventToAppend);
  }

  // 2. Create the "ChangeCommitted" event itself.
  const commitEvent = {
    type: "ChangeCommitted",
    changeId: changeId, // The aggregate ID for this event
    aggregate: "Change", // The aggregate type this event belongs to
    eventId: uuidv4(), // Assign a UUID for the commit event itself
    timestamp: Date.now(),
    payload: {
      status: "Committed", // The new status after this commit
      // Now, committedEventIds will correctly map to the UUIDs assigned above.
      committedEventIds: preparedEvents.map(e => e.eventId)
    }
  };
  preparedEvents.push(commitEvent); // Add the commit event to the list of events to append

  console.log("All events prepared by commitChangeCommand:", JSON.stringify(preparedEvents, null, 2));

  // If validation passes and events are prepared, return them.
  return { success: true, preparedEvents: preparedEvents };
}