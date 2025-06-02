import { replayAggregate } from "../shared/replayAggregate";
import { openEventDB } from "../shared/openEventDB";
import { StoredEvent } from "../shared/genericTypes";

export async function handleCommitChanges(pending: StoredEvent[], changeId: string | null) {
  if (pending.length === 0 || !changeId) {
    console.log("No pending changes to commit or no changeId provided.");
    return;
  }

  try {
    const db = await openEventDB();

    // Start a read-only transaction to get all current events
    const readTx = db.transaction("events", "readonly");
    const store = readTx.objectStore("events");
    const request = store.getAll();
    const currentEvents = await request;

    // Replay the aggregate to determine the current status
    const { status } = replayAggregate(currentEvents, changeId);
    console.log(`8888 Current status for changeId ${changeId}:`, status);
    // If no changeId is provided, throw an error
    // Check if the status allows committing
    if (status !== "Open" && status !== "Committed") {
        alert(`Cannot commit changes. Change with ID ${changeId} has status ${status}.`);
        return; // Exit the function
    }

    // Start a read-write transaction to commit pending events
    const writeTx = db.transaction("events", "readwrite");
    const writeStore = writeTx.objectStore("events");

    // Add pending events to the store
    for (const ev of pending) {
      await writeStore.add(ev);
    }

    await writeTx.done;
    console.log("Changes committed successfully.");
  } catch (err) {
    console.error("Error committing changes:", err);
    throw new Error("Failed to commit changes.");
  }
}
