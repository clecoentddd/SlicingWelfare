// src/slices/02_commitChanges/handleCommitCommand.js

import { replayAggregate } from "../shared/replayAggregate.js";
import { appendEvent } from "../../eventStore/eventRepository.js";
import { handleEventForProjection } from '../03_viewResources/handleCommittedEventForProjection.js';
import { commitChangeCommand } from "./commitChangeCommand.js"; // Import the refined command

/**
 * Handles the request to commit changes.
 * This function acts as the "application service" or "handler" for the commit operation.
 * It orchestrates fetching current state, calling the commit command for validation and event preparation,
 * and then persisting those events.
 *
 * @param {Array<Object>} pending - The list of pending events (e.g., IncomeAdded, ExpenseAdded) from the UI.
 * @param {string} changeId - The ID of the change being committed.
 * @returns {Promise<boolean>} A Promise that resolves to `true` if the commit was successful, `false` otherwise (after an alert).
 */
export async function handleCommitCommand(pending, changeId) {
  // Initial quick check for prerequisites (optional, could also be in command)
  if (!changeId) { // No need to check pending.length here, command will do it and alert.
    console.log("No changeId provided for commit.");
    alert("No active change selected to commit.");
    return false;
  }

  try {
    // 1. Fetch current status of the change aggregate (handler's responsibility)
    const { status: currentChangeStatus } = await replayAggregate(changeId);
    console.log(`Current status for changeId ${changeId}:`, currentChangeStatus);

    // 2. Call the domain command. It performs validation and prepares all events if successful.
    const commandResult = await commitChangeCommand(pending, changeId, currentChangeStatus);

    // If the command returned null, it means validation failed and an alert was already shown.
    if (commandResult === null || !commandResult.success) {
      console.log("Commit command indicated that the operation is not allowed.");
      return false; // Stop execution, alert was already shown by the command.
    }

    // Now, the handler takes responsibility for persisting the events prepared by the command.
    const { preparedEvents } = commandResult;
    const storedEvents = [];

    // 3. Save all prepared events to the event store
    for (const eventToStore of preparedEvents) {
      const storedEvent = await appendEvent(eventToStore);
      storedEvents.push(storedEvent);
    }
    console.log("All prepared events successfully appended to EventDB:", storedEvents);

    // 4. Trigger the Projection Update for ALL newly committed events
    for (const eventToProject of storedEvents) {
      await handleEventForProjection(eventToProject);
    }

    console.log("All committed events have been passed to the projection system.");
    return true; // Indicate success
  } catch (err) {
    console.error("Error committing changes in handler:", err);
    // For unexpected technical errors, alert the user and re-throw for higher-level handling.
    alert("An unexpected error occurred during commit: " + err.message);
    throw new Error("Failed to commit changes: " + err.message);
  }
}