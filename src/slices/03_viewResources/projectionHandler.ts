// src/slices/viewResources/projectionHandler.ts
import { openResourceDB } from "./openResourceDB";
import { openEventDB } from "../shared/openEventDB";
import type { StoredEvent } from "@/slices/shared/genericTypes";

let lastProcessedTimestamp = 0; // Initialize with a default value

async function processEvents() {
  try {
    const eventDB = await openEventDB();
    const resourceDB = await openResourceDB();

    // Start a read-only transaction to fetch events
    const readTx = eventDB.transaction("events", "readonly");
    const eventStore = readTx.objectStore("events");
    const events = await eventStore.getAll();


    // Filter events that are newer than the last processed timestamp
    const newEvents = events.filter(event => event.timestamp > lastProcessedTimestamp);

    if (newEvents.length > 0) {
      // Start a read-write transaction for resources
      const writeTx = resourceDB.transaction("resources", "readwrite");
      const resourceStore = writeTx.objectStore("resources");

      // Process each new event
      for (const ev of newEvents) {
        if (ev.type === "IncomeAdded" || ev.type === "ExpenseAdded") {
          const { changeId, description, amount, period } = ev.payload;
          const status = "Committed";

          const start = new Date(period.start);
          const end = new Date(period.end);
          const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
          const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

          while (current <= last) {
            const month = `${(current.getUTCMonth() + 1).toString().padStart(2, '0')}-${current.getUTCFullYear()}`;
            const uniqueKey = `${ev.id}-${month}`;
            console.log("Unique Key:", uniqueKey);
          
            const resourceObject = {
              id: uniqueKey,
              month,
              type: ev.type === "IncomeAdded" ? "Income" : "Expense",
              description,
              amount,
              changeId,
              status,
              timestamp: ev.timestamp
            };
          
            console.log("Resource Object:", resourceObject);
          
            const putRequest = resourceStore.put(resourceObject);
          
            putRequest.onsuccess = (event) => {
              const target = event.target as IDBRequest;
              if (!target) {
                console.error("Event target is null");
              }
            };
          
            putRequest.onerror = (event) => {
              const target = event.target as IDBRequest;
              if (target) {
                console.error("Error adding/updating record:", target.error);
              } else {
                console.error("Event target is null");
              }
            };
          
            current.setUTCMonth(current.getUTCMonth() + 1);
          }
        }
      }

      // Update the last processed timestamp to the newest event's timestamp
      lastProcessedTimestamp = Math.max(...newEvents.map(event => event.timestamp));

      // Wait for the transaction to complete
      await new Promise<void>((resolve, reject) => {
        writeTx.oncomplete = () => resolve();
        writeTx.onerror = () => reject(writeTx.error);
      });

      console.log("✅ Projection committed to resources store");
    } else {
      console.log("No new events to process.");
    }
  } catch (err) {
    console.error("🔥 Error in processEvents:", err);
  }
}



export async function startProjectionListener() {
  // Process events immediately
  await processEvents();

  // Set up a polling mechanism to periodically check for changes
  setInterval(async () => {
    await processEvents();
  }, 5000); // Poll every 5 seconds
}
