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
    return dbInstance; // Return existing instance if already open
  }

  // Open the database using the idb library
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // This 'upgrade' callback runs when the database is first created
      // or when the DB_VERSION is incremented.

      // Version 1 upgrade: Create the 'events' object store and its indexes
      if (oldVersion < 1) {
        console.log(`EventDB: Creating object store '${EVENT_STORE_NAME}' for version 1.`);
        const eventStore = db.createObjectStore(EVENT_STORE_NAME, {
          keyPath: "id",         // 'id' will be the unique key for each event
          autoIncrement: true,   // Automatically generate 'id' if not provided
        });

        // Create an index on 'payload.changeId' to efficiently query events by change ID
        eventStore.createIndex("byChangeId", "payload.changeId", { unique: false });

        // Create an index on 'timestamp' for sorting or querying by time
        eventStore.createIndex("byTimestamp", "timestamp", { unique: false });
      }
      // Add any further upgrade steps for future versions here
      // For example:
      // if (oldVersion < 2) {
      //   // Add new index or object store for version 2
      // }
    },
    blocked() {
      // This event is fired if a database upgrade is blocked by another open connection
      console.warn('EventDB: Database upgrade blocked. Please close all tabs with this application.');
    },
    blocking() {
      // This event is fired when a new version of the database is ready,
      // and other connections are still holding old versions open.
      console.log('EventDB: New database version is available, waiting for other connections to close.');
    }
  });

  console.log(`EventDB: Database '${DB_NAME}' opened successfully.`);
  return dbInstance;
}