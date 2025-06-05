// src/eventStore/eventDb.js

// Make sure you import openDB from the 'idb' library
import { openDB } from 'idb';

// Import your constants for DB name, version, and store name
import { DB_NAME, DB_VERSION, EVENT_STORE_NAME } from './eventDbConstants.js';

let dbInstance = null; // To store the singleton database instance

/**
 * Initializes and returns the Event IndexedDB instance.
 * This function ensures that the database is opened only once (singleton pattern).
 * @returns {Promise<IDBPDatabase>} The IndexedDB database instance.
 */
export async function getEventDB() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        console.log(`EventDB: Creating object store '${EVENT_STORE_NAME}' for version 1.`);
        const eventStore = db.createObjectStore(EVENT_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        eventStore.createIndex("byChangeId_old_payload", "payload.changeId", { unique: false });
        eventStore.createIndex("byTimestamp", "timestamp", { unique: false });
        console.log("EventDB: Version 1 initial indexes created.");
      }

      if (oldVersion < 2) {
        console.log(`EventDB: Upgrading to version 2. Adapting indexes for new event format.`);
        const eventStore = transaction.objectStore(EVENT_STORE_NAME);

        if (eventStore.indexNames.contains("byChangeId_old_payload")) {
          eventStore.deleteIndex("byChangeId_old_payload");
          console.log("EventDB: Deleted old 'byChangeId_old_payload' index.");
        }

        eventStore.createIndex("byChangeId", "changeId", { unique: false });
        console.log("EventDB: Created new 'byChangeId' index on top-level 'changeId'.");

        eventStore.createIndex("byAggregate", "aggregate", { unique: false });
        console.log("EventDB: Created 'byAggregate' index.");

        eventStore.createIndex("byAggregateAndChangeId", ["aggregate", "changeId"], { unique: false });
        console.log("EventDB: Created 'byAggregateAndChangeId' compound index.");
      }
    },
    blocked() {
      console.warn('EventDB: Database upgrade blocked. Please close all tabs with this application.');
    },
    blocking() {
      console.log('EventDB: New database version is available, waiting for other connections to close.');
    }
  });

  console.log(`EventDB: Database '${DB_NAME}' opened successfully.`);
  return dbInstance;
}