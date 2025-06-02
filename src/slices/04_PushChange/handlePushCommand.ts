import { openEventDB } from "../shared/openEventDB";
import { Event, StoredEvent } from "../shared/genericTypes";
import { replayAggregate } from "../shared/replayAggregate";
import { publishDataPushedEvent } from "./eventPushedPublishedHandler";

export async function handlePushCommand(changeId: string) {
  const db = await openEventDB();
  const tx = db.transaction("events", "readonly");
  const store = tx.objectStore("events");
  const currentEvents = await store.getAll();

  // Use replayAggregate to determine the current state of the aggregate
  const { status } = replayAggregate(currentEvents, changeId);
  console.log(`Change status for ${changeId}:`, status);

  if (status !== "Committed") {
    throw new Error("Change must be committed before it can be pushed.");
  }

  const ev: Event = {
    type: "ChangePushed",
    timestamp: Date.now(),
    payload: { changeId, status: "Pushed" }
  };

  // Start a new transaction for writing
  const writeTx = db.transaction("events", "readwrite");
  const writeStore = writeTx.objectStore("events");

  // Add the event and capture the generated id
  const eventId = await writeStore.add(ev);
  console.log("Event added with ID:", eventId);

  // Ensure eventId is treated as a number
  const numericEventId = typeof eventId === 'number' ? eventId : parseInt(eventId as string, 10);
  console.log("Event added with numeric ID:", numericEventId);

  await writeTx.done;

  // Publish the DataPushed event with the numericEventId
  console.log("Ready to push/sub", changeId);
  await publishDataPushedEvent(changeId, numericEventId);
}
