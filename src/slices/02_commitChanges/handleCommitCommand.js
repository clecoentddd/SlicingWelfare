// src/slices/02_commitChanges/handleCommitChanges.js

import { replayAggregate } from "../shared/replayAggregate";
// REMOVE THIS LINE: import { SaveCommitEventToEventStore } from "./SaveCommitEventToEventStore";

// NEW: Import appendEvent from the centralized event repository
import { appendEvent } from "../../eventStore/eventRepository.js";

// Import the projection entry point from your 03_viewResources slice
import { handleEventForProjection } from '../03_viewResources/handleEventForProjection';

export async function handleCommitCommand(pending, changeId) {
  if (pending.length === 0 || !changeId) {
    console.log("No pending changes to commit or no changeId provided.");
    return;
  }

  try {
    // Replay the aggregate to determine the current status
    // This call assumes replayAggregate internally fetches the necessary events
    const { status } = await replayAggregate(changeId);
    console.log(`Current status for changeId ${changeId}:`, status);

    // Check if the status allows committing
    if (status !== "Open" && status !== "Committed") {
      alert(`Cannot commit changes. Change with ID ${changeId} has status ${status}.`);
      return; // Exit the function
    }

    const newlyCommittedEvents = []; // To collect events after they are stored

    // Save each pending event to the event store using appendEvent
    for (const event of pending) {
      // Ensure changeId is in payload for replayAggregate/indexing if not already there
      const eventToAppend = {
        ...event,
        payload: { ...event.payload, changeId: event.payload.changeId || changeId }
      };
      const storedEvent = await appendEvent(eventToAppend); // Call appendEvent for each
      newlyCommittedEvents.push(storedEvent);
    }
    console.log("Pending events successfully appended to EventDB:", newlyCommittedEvents);

    // After committing the individual events, append a "ChangeCommitted" event itself
    const commitEvent = {
      type: "ChangeCommitted",
      timestamp: Date.now(),
      payload: {
        changeId: changeId,
        status: "Committed",
        // It's good practice to link to the committed events by their UUIDs
        committedEventIds: newlyCommittedEvents.map(e => e.eventId)
      }
    };
    const storedCommitEvent = await appendEvent(commitEvent);
    newlyCommittedEvents.push(storedCommitEvent); // Add the commit event to the list if needed for projection

    // Trigger the Projection Update for ALL newly committed events (including the ChangeCommitted event)
    for (const eventToProject of newlyCommittedEvents) {
      // Pass each committed event (now with its ID and UUID) to the projection handler.
      await handleEventForProjection(eventToProject);
    }

    console.log("All committed events have been passed to the projection system.");

  } catch (err) {
    console.error("Error committing changes:", err);
    throw new Error("Failed to commit changes: " + err.message); // Re-throw to propagate the error
  }
}