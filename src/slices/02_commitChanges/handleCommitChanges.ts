// src/slices/02_commitChanges/handleCommitChanges.ts
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
  
      // Start a read-write transaction to commit pending events
      const tx = db.transaction("events", "readwrite");
      const store = tx.objectStore("events");
  
      // Add pending events to the store
      for (const ev of pending) {
        await store.add(ev);
      }
  
      await tx.done;
      console.log("Changes committed successfully.");
    } catch (err) {
      console.error("Error committing changes:", err);
      throw new Error("Failed to commit changes.");
    }
  }