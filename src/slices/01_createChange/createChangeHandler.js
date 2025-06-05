// src/slices/01_createChange/createChangeHandler.js
"use client";

import { appendEvent, getAllEvents } from "../../eventStore/eventRepository.js";
import { replayAggregate } from "../shared/replayAggregate";
// IMPORTANT: Ensure your command file is named 'createCommand.js' or 'createChangeCommand.js' as appropriate.
import { createChange } from "./createChangeCommand.js"; // Assuming createCommand.js as per our last full file output
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles the request to create a new Change.
 * This function acts as the "application service" or "handler." Its primary role
 * is to orchestrate the command execution and event persistence.
 * It now pre-fetches and provides ALL necessary state information and the new aggregate ID to the domain command.
 *
 * @param {string} [requestedChangeId] - Optional. A pre-generated UUID for the new Change. If not provided, one will be generated here.
 * @returns {object|null} The stored event, including the ID assigned by the event store, or null if the operation is aborted.
 */
export async function createChangeHandler(requestedChangeId) {
  console.log("Handling request to create a new change (via createChangeHandler)...");

  try {
    // 1. Generate the UUID for the new Change aggregate here (if not provided externally)
    const newChangeId = requestedChangeId || uuidv4();
    console.log(`Handler determined newChangeId: ${newChangeId}`);

    // 2. Fetch current domain state needed for validation and pass it to the command
    const currentEvents = await getAllEvents();
    console.log(`Current events in DB (for handler pre-validation): ${currentEvents.length} events`);

    const uniqueChangeIds = [...new Set(currentEvents
      .filter(event => event.aggregate === "Change" && event.changeId)
      .map(event => event.changeId)
    )];

    const existingChangeStatuses = [];
    for (const id of uniqueChangeIds) {
      const { status } = await replayAggregate(id);
      existingChangeStatuses.push({ changeId: id, status: status });
    }
    console.log("Existing change statuses computed by handler:", existingChangeStatuses);

    // 3. Execute the command: Pass the explicitly generated newChangeId and the pre-computed statuses.
    // The createChange command will alert and return null if a business rule is violated.
    const preparedEvent = await createChange(newChangeId, existingChangeStatuses);

    // If the command returned null, it means it already handled the pop-up and exited.
    if (!preparedEvent) {
      console.log("Command execution aborted due to business rule. No event stored.");
      return null; // Stop the handler's execution.
    }

    // 4. Append the prepared event to the event store. This code only runs if preparedEvent is not null.
    console.log("Appending ChangeCreated event to event store (from handler):", JSON.stringify(preparedEvent, null, 2));
    const storedEvent = await appendEvent(preparedEvent);

    console.log(`Change created with ID (from handler): ${storedEvent.changeId}, Event Store ID: ${storedEvent.id}`);

    return storedEvent;
  } catch (error) {
    // This catch block handles any other unexpected *technical* errors
    // that might occur during the handler's execution (e.g., DB connection issues).
    console.error("Error creating change in handler:", error.message);
    // You might want to display a different type of alert for these technical errors,
    // or log them and let the application handle them gracefully.
    // For now, it re-throws, which is standard for unhandled technical exceptions.
    throw error;
  }
}