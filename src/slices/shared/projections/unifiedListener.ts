// src/listeners/unifiedListener.ts
import { openResourceDB } from '../openResourceDB'; // Your updated openResourceDB
import { fetchEvents, hasId } from '../sharedProjections'; // Assuming fetchEvents and hasId are here
import { commitEventHandler } from '../../03_viewResources/committedEventHandler'; // Your commit handler
import { pushedEventHandler } from '../../05_updateChangesToPushed/pushedEventHandler'; // Your pushed handler
import type { StoredEvent } from '../genericTypes'; // Assuming genericTypes are here
import type { IDBPObjectStore, IDBPTransaction } from 'idb'; // For IndexedDB types

const POLLING_INTERVAL_MS = 1000; // Poll for new events every 3 seconds

let listenerIntervalId: NodeJS.Timeout | null = null; // To store the interval ID for cleanup

async function processAllNewEvents(): Promise<void> {
  // console.log("Unified Listener (Module): Checking for new events...");
  try {
    const events = await fetchEvents(); // This fetches events newer than lastProcessedTimestamp
    if (events.length === 0) {
     // console.log("Unified Listener (Module): No new events found.");
      return;
    }

    console.log(`Unified Listener (Module): Found ${events.length} new events to process.`);

    // Open a single read-write transaction for all updates in this batch
    const resourceDB = await openResourceDB();
    const tx: IDBPTransaction<unknown, ["resources"], "readwrite"> = resourceDB.transaction("resources", "readwrite");
    const resourceStore = tx.objectStore("resources");

    const eventProcessingPromises: Promise<void>[] = [];

    for (const ev of events) {
      if (!hasId(ev)) {
        console.warn(`Unified Listener (Module): Skipping event without ID: ${JSON.stringify(ev)}`);
        continue;
      }

      console.log(`Unified Listener (Module): Dispatching Event ID ${ev.id}, Type: ${ev.type}`);

      switch (ev.type) {
        case "IncomeAdded":
        case "ExpenseAdded":
          eventProcessingPromises.push(commitEventHandler(ev, resourceStore));
          break;
        case "ChangePushed":
          eventProcessingPromises.push(pushedEventHandler(ev, resourceStore));
          break;
        default:
          console.log(`Unified Listener (Module): No handler defined for event type '${ev.type}' (Event ID: ${ev.id}). Skipping.`);
          break;
      }
    }

    // Wait for all individual event handlers to queue their DB operations within this single transaction
    await Promise.all(eventProcessingPromises);

    // Commit the single transaction
    await tx.done;
    // console.log("Unified Listener (Module): All events in batch processed and single transaction committed successfully.");

  } catch (error) {
    console.error("🔥 Unified Listener (Module) Error: Transaction or event processing failed:", error);
    // The transaction will automatically abort if an error occurs and is not caught within its scope.
    // Re-throw to propagate if you want outer error handling.
    throw error;
  }
}

/**
 * Starts the unified projection listener, including an initial run and then polling.
 */
export async function startUnifiedProjectionListener(): Promise<void> {
  //console.log("Starting Unified Projection Listener from module...");
  // Clear any existing interval to prevent multiple listeners
  if (listenerIntervalId) {
    clearInterval(listenerIntervalId);
    listenerIntervalId = null;
  }

  // Initial run when called
  await processAllNewEvents();

  // Set up the polling interval
  listenerIntervalId = setInterval(() => {
    // console.log("Unified Listener (Module): Polling for new events...");
    processAllNewEvents();
  }, POLLING_INTERVAL_MS);
}

/**
 * Stops the unified projection listener. Call this on component unmount.
 */
export function stopUnifiedProjectionListener(): void {
  if (listenerIntervalId) {
   // console.log("Stopping Unified Projection Listener from module.");
    clearInterval(listenerIntervalId);
    listenerIntervalId = null;
  }
}