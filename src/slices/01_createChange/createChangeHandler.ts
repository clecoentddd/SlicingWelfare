"use client";

import { openEventDB } from "../shared/openEventDB";
import { ChangeCreatedEvent, StoredEvent } from "../shared/genericTypes";
import { replayAggregate } from "../shared/replayAggregate";

export async function createChangeHandler() {
  console.log("Creating a new change...");

  // Open the IndexedDB database
  const db = await openEventDB();

  // Start a read-only transaction to check for existing changes
  const readTx = db.transaction("events", "readonly");
  const store = readTx.objectStore("events");
  const request = store.getAll();

  // Wait for the request to complete
  const currentEvents = await request;

  console.log("Current events in DB:", currentEvents);

  // Get unique changeIds from the events
  const changeIds = [...new Set(currentEvents.map(event => event.payload.changeId))];

  // Replay each aggregate to check the status
  for (const changeId of changeIds) {
    const { status } = replayAggregate(currentEvents, changeId);

    if (status === "Open") {
      throw new Error(`Cannot create a new change because there is already an open change with ID ${changeId} and status ${status}.`);
    }
  }

  // Generate a simple hex ID
  const changeId = `0x${Math.floor(Math.random() * 0xffff).toString(16)}`;

  // Build the event in the format defined in genericTypes.ts
  const event: ChangeCreatedEvent = {
    type: "ChangeCreated",
    timestamp: Date.now(),
    payload: {
      changeId,
      status: "Open", // initial lifecycle state
    },
  };

  console.log("Adding Change created to IndexedDB:", event);

  // Start a read-write transaction to append the new event
  const writeTx = db.transaction("events", "readwrite");
  const writeStore = writeTx.objectStore("events");
  await writeStore.add(event as StoredEvent);
  await writeTx.done;

  console.log("Change created with ID:", changeId);

  // Return the changeId to the client
  return { changeId };
}
