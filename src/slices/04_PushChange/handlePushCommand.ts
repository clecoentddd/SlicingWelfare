// src/slices/pushChange/handlePushCommand.ts
import { openEventDB } from "../shared/openEventDB";
import { Event, StoredEvent } from "../shared/genericTypes";
import { replayAggregate } from "../shared/replayAggregate";

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
  await writeStore.add(ev);
  await writeTx.done;
}
