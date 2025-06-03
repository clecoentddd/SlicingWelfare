// src/slices/01_createChange/createChangeHandler.js
"use client";

import { replayAggregate } from "../shared/replayAggregate";
import { appendEvent, getAllEvents } from "../../eventStore/eventRepository.js";
import { v4 as uuidv4 } from 'uuid'; // KEEP this import here, as uuidv4() is used in THIS file

export async function createChangeHandler() {
  console.log("Creating a new change (via createChangeHandler)...");

  // Get all current events to check for existing open changes
  const currentEvents = await getAllEvents();
  console.log("Current events in DB (via repository):", currentEvents);

  // Get unique changeIds from the events to check their status
  const changeIds = [...new Set(currentEvents.map(event => event.payload?.changeId).filter(Boolean))];

  // Replay each aggregate to ensure no 'Open' changes exist
  for (const existingChangeId of changeIds) {
    const { status } = await replayAggregate(existingChangeId);

    if (status === "Open") {
      throw new Error(`Cannot create a new change because there is already an open change with ID ${existingChangeId} and status ${status}.`);
    }
  }

  // Generate a UUID for the new changeId
  const newChangeId = uuidv4();

  // Build the ChangeCreated event object
  const event = {
    type: "ChangeCreated",
    timestamp: Date.now(),
    payload: {
      changeId: newChangeId,
      status: "Open", // initial lifecycle state
    },
  };

  console.log("Appending ChangeCreated event (from handler):", event);

  // Use appendEvent from the repository to store the event in IndexedDB
  const storedEvent = await appendEvent(event);

  console.log("Change created with ID (from handler):", storedEvent.payload.changeId);

  // Return the full stored event, including its generated IndexedDB 'id' and 'eventId' (UUID)
  return storedEvent;
}