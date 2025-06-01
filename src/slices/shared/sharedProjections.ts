// src/slices/shared/sharedProjections.ts

import { openEventDB } from "./openEventDB"; // Assuming openEventDB correctly opens your EventDB
import { openResourceDB } from "./openResourceDB"; // Using the openResourceDB from src/utils/openResourceDB.ts
import type { StoredEvent } from "./genericTypes";
import type { IDBPObjectStore, IDBPTransaction } from 'idb'; // Import IDBP types from 'idb'

// Renamed and made more explicit
const LAST_PROCESSED_TIMESTAMP_KEY = 'lastProcessedTimestamp'; // Key for storing in metadata store

export function hasId(ev: StoredEvent): ev is StoredEvent & { id: number } {
    return typeof (ev as any).id === 'number';
}

export async function fetchEvents(): Promise<StoredEvent[]> {
    const eventDB = await openEventDB(); // Ensure this opens your EventDB, not ResourceDB

    let currentLastProcessedTimestamp = 0;
    try {
        // Read lastProcessedTimestamp from the 'metadata' object store in EventDB
        const metadataTx = eventDB.transaction("metadata", "readonly");
        const metadataStore = metadataTx.objectStore("metadata");
        const storedTimestamp = await metadataStore.get(LAST_PROCESSED_TIMESTAMP_KEY);
        await metadataTx.done; // Ensure transaction completes
        if (typeof storedTimestamp === 'number') {
            currentLastProcessedTimestamp = storedTimestamp;
        }
        console.log(`fetchEvents: Loaded lastProcessedTimestamp from DB: ${currentLastProcessedTimestamp}`);
    } catch (err) {
        console.warn("fetchEvents: Error loading lastProcessedTimestamp from DB. Defaulting to 0. This might be normal for first run if 'metadata' store or key doesn't exist yet.", err);
        currentLastProcessedTimestamp = 0;
    }

    const readTx = eventDB.transaction("events", "readonly");
    const eventStore = readTx.objectStore("events");
    const allEvents = await eventStore.getAll();
    await readTx.done; // Ensure transaction completes

    const newEvents = allEvents.filter(event => event.timestamp > currentLastProcessedTimestamp);
    console.log(`fetchEvents: Found ${newEvents.length} new events since last processed timestamp ${currentLastProcessedTimestamp}.`);

    if (newEvents.length > 0) {
        const newestTimestamp = Math.max(...newEvents.map(event => event.timestamp));
        // Only update if there are genuinely newer events
        if (newestTimestamp > currentLastProcessedTimestamp) {
            console.log(`fetchEvents: Newest event timestamp is ${newestTimestamp}. Persisting this as lastProcessedTimestamp.`);
            // Persist the new lastProcessedTimestamp to the 'metadata' object store
            const writeMetadataTx = eventDB.transaction("metadata", "readwrite");
            const metadataStore = writeMetadataTx.objectStore("metadata");
            await metadataStore.put(newestTimestamp, LAST_PROCESSED_TIMESTAMP_KEY); // Use put with key
            await writeMetadataTx.done; // Ensure transaction completes
            console.log(`fetchEvents: Persisted lastProcessedTimestamp to DB: ${newestTimestamp}`);
        }
    }

    return newEvents;
}

/**
 * Processes a batch of events within a single IndexedDB readwrite transaction.
 * The handler function receives the event and the IDBPObjectStore to perform operations.
 */
export async function processEventsWithHandler(
    events: StoredEvent[],
    handler: (ev: StoredEvent, resourceStore: IDBPObjectStore<unknown, ["resources"], "resources", "readwrite">) => Promise<void>
): Promise<void> {
    if (events.length === 0) {
        console.log("processEventsWithHandler: No events to process in this batch.");
        return;
    }

    console.log(`processEventsWithHandler: Starting processing for ${events.length} events in a single transaction.`);
    // Ensure openResourceDB from src/utils/openResourceDB is used here
    const resourceDB = await openResourceDB();
    const tx: IDBPTransaction<unknown, ["resources"], "readwrite"> = resourceDB.transaction("resources", "readwrite");
    const resourceStore = tx.objectStore("resources");

    try {
        const handlerPromises: Promise<void>[] = [];
        for (const ev of events) {
            handlerPromises.push(handler(ev, resourceStore));
        }

        await Promise.all(handlerPromises);

        await tx.done; // This will throw if any promise inside the transaction rejects
        console.log("processEventsWithHandler: All events processed and single transaction committed successfully.");

    } catch (error) {
        console.error("processEventsWithHandler: Transaction failed:", error);
        // IndexedDB transactions created with `idb`'s `db.transaction()` will automatically
        // abort if any promise within their scope rejects. Explicit `tx.abort()` is rarely
        // needed if you await `tx.done()`.
        console.log("processEventsWithHandler: Transaction likely aborted due to error.");
        throw error; // Re-throw the error to be caught by the unified listener for overall error handling.
    }
}