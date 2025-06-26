// src/slices/04_PushChange/pushChangeCommand.js

import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the **pushChange command**.
 * This function encapsulates the business logic for determining if a push is allowed
 * and suggests the 'ChangePushed' event to be emitted.
 * It does NOT append the event to the event store or handle side effects or UI.
 *
 * @param {string} changeId - The ID of the change to be pushed.
 * @param {string} currentChangeStatus - The current status of the change aggregate (e.g., "Open", "Committed", "Pushed").
 * @returns {Object} The suggested 'ChangePushed' event object if the command is allowed.
 * @throws {Error} If the command is not allowed based on the current change status (business rule violation).
 */
export function cancelChangeCommand(changeId, currentChangeStatus) {
  // Business Rule: A change can only be pushed if its status is "Committed".
  if (currentChangeStatus !== "Committed") {
    // Instead of throwing an error, return null to indicate failure
    // The handler (caller) must check for this null return.
    console.warn(`Can only cancel changes that are committed. Command failed: Change with ID ${changeId} has status "${currentChangeStatus}". Expected "Committed".`);
    return null; // Signal that the command cannot proceed
  }

  // If the business rule passes, proceed to suggest the event.
  const suggestedEvent = {
    type: "ChangeCancelled",
    changeId: changeId, // The aggregate ID for this event
    aggregate: "Change", // The aggregate type this event belongs to
    eventId: uuidv4(), // Assign a unique UUID for this specific event
    timestamp: Date.now(),
    payload: {
      status: "Cancelled" // The new status after this push
    }
  };

  return suggestedEvent;
}