// src/eventStore/readEvents.ts

import { openDB, type DBSchema } from 'idb';
import { StoredEvent, EventWithId } from './genericTypes'; // Import necessary types

// Make sure your EventDBSchema is consistent with your SaveCommitEventToEventStore
interface EventDBSchema extends DBSchema {
  events: {
    key: number;
    value: StoredEvent & { id: number }; // Should match EventWithId
    indexes: {
      byChangeId: string; // This index is crucial for querying by changeId
    };
  };
}

const EVENT_DB_NAME = "EventDB";
const EVENT_DB_VERSION = 3; // Ensure this matches your actual DB version
const EVENT_STORE_NAME = "events";

/**
 * Retrieves all events associated with a specific changeId from the EventDB.
 * @param changeId The changeId to query events for.
 * @returns A promise that resolves with an array of EventWithId objects.
 */
export async function getEventsByChangeId(changeId: string): Promise<EventWithId[]> {
    const db = await openDB<EventDBSchema>(EVENT_DB_NAME, EVENT_DB_VERSION);
    const tx = db.transaction(EVENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(EVENT_STORE_NAME);
    console.log("getEventsByChangeId", changeId)
    const index = store.index('byChangeId'); // Access the index by its name

    // Query the index for all events where 'payload.changeId' matches the provided changeId
    const events = await index.getAll(changeId);
    await tx.done; // Wait for the transaction to complete
    return events as EventWithId[]; // Cast to EventWithId[] as we expect them to have IDs
}