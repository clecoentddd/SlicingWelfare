// src/listeners/unifiedListener.ts
import { openResourceDBWithIdb, type AppDBSchema, type Resource } from '../openResourceDBListener';
import { fetchEvents, hasId } from '../sharedProjections';
import { commitEventHandler } from '../../03_viewResources/committedEventHandler';
import { pushedEventHandler } from '../../05_updateChangesToPushed/pushedEventHandler';
import type { StoredEvent, EventWithId } from '../genericTypes'; // Import EventWithId
import type { IDBPObjectStore, IDBPTransaction } from 'idb';

const POLLING_INTERVAL_MS = 1000;
const RESOURCE_STORE_NAME = "resources";

let listenerIntervalId: NodeJS.Timeout | null = null;

async function processAllNewEvents(): Promise<void> {
  try {
    // FIX: fetchEvents now returns EventWithId[]
    const events: EventWithId[] = await fetchEvents();
    if (events.length === 0) {
      return;
    }

    console.log(`Unified Listener (Module): Found ${events.length} new events to process.`);

    const resourceDB = await openResourceDBWithIdb();
    
    const tx: IDBPTransaction<AppDBSchema, [typeof RESOURCE_STORE_NAME], "readwrite"> = resourceDB.transaction(RESOURCE_STORE_NAME, "readwrite");
    
    const resourceStore: IDBPObjectStore<AppDBSchema, [typeof RESOURCE_STORE_NAME], typeof RESOURCE_STORE_NAME, "readwrite"> = tx.objectStore(RESOURCE_STORE_NAME);

    const eventProcessingPromises: Promise<void>[] = [];

    // FIX: 'ev' is now correctly typed as EventWithId from fetchEvents()
    for (const ev of events) {
      // The 'hasId' check might become redundant here if fetchEvents always returns EventWithId,
      // but it's good defensive programming if 'events' could originate elsewhere.
      if (!hasId(ev)) { // hasId is defined in sharedProjections.ts
        console.warn(`Unified Listener (Module): Skipping event without ID: ${JSON.stringify(ev)}`);
        continue;
      }

      console.log(`Unified Listener (Module): Dispatching Event ID ${ev.id}, Type: ${ev.type}`);

      switch (ev.type) {
        case "IncomeAdded":
        case "ExpenseAdded":
          // The handlers will now also expect EventWithId for 'ev'
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

    await Promise.all(eventProcessingPromises);

    await tx.done;
    console.log("Unified Listener (Module): All events in batch processed and single transaction committed successfully.");

  } catch (error) {
    console.error("🔥 Unified Listener (Module) Error: Transaction or event processing failed:", error);
    throw error;
  }
}

export async function startUnifiedProjectionListener(): Promise<void> {
  if (listenerIntervalId) {
    clearInterval(listenerIntervalId);
    listenerIntervalId = null;
  }

  await processAllNewEvents();

  listenerIntervalId = setInterval(() => {
    processAllNewEvents();
  }, POLLING_INTERVAL_MS);
}

export function stopUnifiedProjectionListener(): void {
  if (listenerIntervalId) {
    clearInterval(listenerIntervalId);
    listenerIntervalId = null;
  }
}