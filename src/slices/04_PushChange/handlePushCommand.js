// src/slices/04_PushChange/handlePushCommand.js

// Imports based on the handleCommitChanges pattern
import { replayAggregate } from "../shared/replayAggregate.js";
import { appendEvent } from "../../eventStore/eventRepository.js";
import { publishPushedDomainEvent } from "./eventPublishedPushDomainEventHandler.js";
import { pushedEventHandler } from '../05_updateChangesToPushed/pushedEventHandler.js';

export async function handlePushCommand(changeId) {
  if (!changeId) {
    console.log("No changeId provided for push command.");
    return;
  }

  try {
    // Replay the aggregate to determine the current status.
    const { status } = await replayAggregate(changeId);
    console.log(`Current status for changeId ${changeId}:`, status);

    // Check if the status allows pushing
    if (status !== "Committed") {
      alert(`Cannot push changes. Change with ID ${changeId} has status ${status}.`);
      return; // Exit the function
    }

    // Prepare the ChangePushed event
    const pushEvent = {
      type: "ChangePushed",
      timestamp: Date.now(),
      payload: { changeId, status: "Pushed" }
    };

    // Use eventRepository.js to append the new ChangePushed event.
    const storedPushEvent = await appendEvent(pushEvent);
    const localDbId = storedPushEvent.id;

    console.log(`ChangePushed event appended with local DB ID: ${localDbId}, UUID: ${storedPushEvent.eventId}`);

    // Trigger the projection update specifically for the pushed event.
    console.log("Triggering pushedEventHandler for projection update...", storedPushEvent);
    await pushedEventHandler(storedPushEvent); // Ensure this completes successfully

    console.log("Projection updated successfully for changeId:", changeId);

    // Publish the DataPushed event using the external handler
    console.log("Ready to publish DataPushed event for changeId:", changeId);
    await publishPushedDomainEvent(storedPushEvent);

    console.log(`Push command completed for changeId: ${changeId}`);

  } catch (err) {
    console.error("Error pushing changes:", err);
    throw new Error("Failed to push changes: " + err.message); // Re-throw to propagate the error
  }
}
