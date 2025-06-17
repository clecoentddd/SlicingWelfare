// src/slices/04_PushChange/pushChangeHandler.js

import { replayAggregate } from "../shared/replayAggregate.js";
import { appendEvent } from "../../eventStore/eventRepository.js";
import { pushChangeCommand } from './pushChangeCommand.js'; // Import the new command
import { domainEventEmitter } from '../shared/eventEmitter';
import { integrationEventEmitter } from "../shared/eventEmitter";

/**
 * Handles the push change operation.
 * This function orchestrates the steps: replaying the aggregate,
 * invoking the pushChangeCommand, appending the suggested event,
 * and triggering side effects (projection updates, domain event publishing).
 *
 * @param {string} changeId - The ID of the change to be pushed.
 * @returns {Promise<void>} A promise that resolves when the push operation is complete, or rejects on error.
 */
export async function pushChangeHandler(changeId) {
  if (!changeId) {
    console.warn("pushChangeHandler: No changeId provided. Aborting.");
    alert("No change ID provided for the push operation."); // Inform the user
    return;
  }

  console.log(`pushChangeHandler: Attempting to push change with ID: ${changeId}`);

  try {
    // 1. Replay the aggregate to determine its current state.
    const { status } = await replayAggregate(changeId);
    console.log(`pushChangeHandler: Current status of change ${changeId} is '${status}'.`);

    // 2. Execute the command to get the suggested event.
    // IMPORTANT: pushChangeCommand will return null if the business rule is violated.
    const suggestedPushEvent = pushChangeCommand(changeId, status);
    console.log("pushChangeHandler: ChangePushed event suggested by command:", suggestedPushEvent);

    // --- CRITICAL FIX START ---
    // If the command returned null, it means the business rule was violated.
    // We should display an alert and stop processing.
    if (suggestedPushEvent === null) {
      console.warn(`pushChangeHandler: Command indicated no event due to business rule for changeId: ${changeId}.`);
      alert(`Cannot push changes. Change with ID ${changeId} has status "${status}".`);
      return; // Exit the handler, as the command did not suggest an event.
    }
    
    // 3. Append the suggested event to the event store.
    const storedPushEvent = await appendEvent(suggestedPushEvent);
    console.log(`pushChangeHandler: ChangePushed event appended. Local DB ID: ${storedPushEvent.id}, Event ID: ${storedPushEvent.eventId}`);

    // 4. Trigger side effects.
    // Update the local projection for the 'Change' aggregate.
    console.log("pushChangeHandler: Triggering pushedEventHandler for projection update...");
    domainEventEmitter.publish('DataPushed', storedPushEvent);
    console.log("pushChangeHandler: Projection updated successfully.");

    // Publish the domain event to external systems (if any).
    console.log("pushChangeHandler: Publishing DataPushed integration event...");
    integrationEventEmitter.publish('DataPushed', storedPushEvent);
    console.log("pushChangeHandler: DataPushed integration event published successfully.");

    console.log(`pushChangeHandler: Push operation completed successfully for changeId: ${changeId}`);

  } catch (err) {
    // This catch block will now only handle *unexpected* errors that occur
    // during replayAggregate, appendEvent, pushedEventHandler.
    console.error(`pushChangeHandler: An unexpected error occurred during push operation for changeId ${changeId}:`, err);
    alert(`Failed to push changes for ID ${changeId}. Please try again. Error: ${err.message}`);
    // Do NOT re-throw the error to prevent it from showing on the webpage.
  }
}