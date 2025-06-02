// src/slices/shared/openEventDB.ts
import { openDB, IDBPDatabase } from 'idb';

const EVENT_DB_NAME = 'EventDB';
// YOU MUST INCREMENT THIS VERSION to force the upgrade to create 'metadata'.
// If it was 2, change it to 3. If it was 1, change it to 2.
const EVENT_DB_VERSION = 3; // <--- Change this to a new, higher version number

export async function openEventDB(): Promise<IDBPDatabase<unknown>> {
  if (typeof window === 'undefined') {
    throw new Error('indexedDB is not available on the server side.');
  }

  return openDB(EVENT_DB_NAME, EVENT_DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) { // Use all parameters
      console.log(`EventDB upgrade needed: from ${oldVersion} to ${newVersion}`);

      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        eventStore.createIndex('byTimestamp', 'timestamp');
        // console.log("Event store 'events' created.");
      }

      // *** CRITICAL ADDITION: Create the 'metadata' store ***
      if (oldVersion < 3) { // This condition ensures it's created when upgrading to version 3
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
          console.log("Metadata store 'metadata' created.");
        }
      }
    },
  });
}

export async function getAllRawEvents(): Promise<any[]> { // Use 'any[]' or your specific Event type
  const eventDB = await openDB('EventDB', EVENT_DB_VERSION); // Use your correct DB name and version
  const tx = eventDB.transaction('events', 'readonly');
  const store = tx.objectStore('events');
  const allEvents = await store.getAll();
  await tx.done;
  console.log(`getAllRawEvents: Fetched ${allEvents.length} total events from EventDB for display.`);
  return allEvents;
}