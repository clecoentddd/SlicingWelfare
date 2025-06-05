// src/slices/01_createChange/createCommand.js

import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the **createChange command**.
 * This function encapsulates the business logic for deciding if a ChangeCreated event can be emitted.
 * It directly triggers an alert and exits if a business rule is violated.
 *
 * @param {string} newChangeId - The UUID for the new Change, provided by the handler.
 * @param {Array<Object>} existingChangeStatuses - An array of objects, each containing { changeId: string, status: string }, provided by the handler.
 * @returns {Promise<object|null>} A Promise that resolves to the prepared ChangeCreated event object on success, or to null if a business rule prevents creation.
 */
export async function createChange(newChangeId, existingChangeStatuses) {
  console.log("Preparing ChangeCreated event (via createChange command)...");

  // Validate: Check if ANY existing change is already open.
  for (const { changeId: existingId, status } of existingChangeStatuses) {
    if (status === "Open") {
      // Directly show the alert.
      alert(`Cannot create a new change: an open change with ID ${existingId} already exists.`);
      // Explicitly return a resolved Promise with null.
      // This clarifies the return type and satisfies the linter.
      return null; // An async function implicitly wraps this in Promise.resolve(null)
    }
  }

  // If the loop completes, no 'Open' changes were found, so creation can proceed.

  // Generate a unique ID for this specific event instance.
  const eventId = uuidv4();

  // Build the ChangeCreated event object.
  const event = {
    type: "ChangeCreated",
    changeId: newChangeId,
    aggregate: "Change",
    payload: {
      status: "Open",
    },
    eventId: eventId,
    timestamp: Date.now(),
  };

  console.log("ChangeCreated event prepared (from command):", JSON.stringify(event, null, 2));

  // Explicitly return a resolved Promise with the event.
  return event; // An async function implicitly wraps this in Promise.resolve(event)
}