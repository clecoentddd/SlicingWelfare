// src/slices/viewResources/projectionHandler.ts
import { openResourceDB } from "./openResourceDB";
import { openEventDB } from "../shared/openEventDB";
import type { StoredEvent } from "@/slices/shared/genericTypes";

async function processEvents() {
  try {
    const eventDB = await openEventDB();
    const resourceDB = await openResourceDB();

    // Start a read-only transaction to fetch events
    const readTx = eventDB.transaction("events", "readonly");
    const eventStore = readTx.objectStore("events");
    const events = await eventStore.getAll();

    // Start a read-write transaction for resources
    const writeTx = resourceDB.transaction("resources", "readwrite");
    const resourceStore = writeTx.objectStore("resources");

    // Process each event
    for (const ev of events) {
      if (ev.type === "IncomeAdded" || ev.type === "ExpenseAdded") {
        const { changeId, description, amount, period } = ev.payload;
        const status = "Committed"; // default for now

        const start = new Date(period.start);
        const end = new Date(period.end);
        const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
        const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

        while (current <= last) {
          const month = `${(current.getUTCMonth() + 1).toString().padStart(2, '0')}-${current.getUTCFullYear()}`;

          resourceStore.put({
            month,
            type: ev.type === "IncomeAdded" ? "Income" : "Expense",
            description,
            amount,
            changeId,
            status,
            timestamp: ev.timestamp
          });

          current.setUTCMonth(current.getUTCMonth() + 1);
        }
      }
    }

    // Wait for the transaction to complete
    await new Promise<void>((resolve, reject) => {
      writeTx.oncomplete = () => resolve();
      writeTx.onerror = () => reject(writeTx.error);
    });

    console.log("✅ Projection committed to resources store");
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
  }, 1000); // Poll every 5 seconds
}
