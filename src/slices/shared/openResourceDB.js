// src/slices/shared/openResourceDB.js

// Only import 'openDB' from 'idb', as other imports were purely for TypeScript types.
import { openDB } from 'idb';

const RESOURCE_DB_NAME = "ResourceDB";
const RESOURCE_DB_VERSION = 3;
const RESOURCE_STORE_NAME = "resources"; // This is 'resources'

// --- 1. Resource interface (removed - types are implicit in JS) ---
// --- 2. AppDBSchema interface (removed - schema defined in upgrade function) ---

/**
 * Function to open the Resource IndexedDB using the idb library.
 * Defines the database schema and upgrade logic.
 *
 * @returns {Promise<IDBPDatabase>} A promise that resolves with the opened IndexedDB database instance.
 */
export function openResourceDB() { // Type annotations removed
  return openDB(RESOURCE_DB_NAME, RESOURCE_DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        // Create the 'resources' object store if it doesn't exist
        const store = db.createObjectStore(RESOURCE_STORE_NAME, {
          keyPath: "id",
        });
        // Create indexes
        store.createIndex('byMonth', 'month', { unique: false });
        store.createIndex('byStatus', 'status', { unique: false });
        store.createIndex('byChangeId', 'changeId', { unique: false });
        // The 'EVENT_ID' index was part of the oldVersion < 1, now explicitly in oldVersion < 3 too.
        store.createIndex('EVENT_ID', 'EVENT_ID', { unique: false });
      }

      // Specific upgrade path for version 3 (if needed, ensure it handles existing stores gracefully)
      if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(RESOURCE_STORE_NAME)) {
              // This case implies the store might not exist yet, which contradicts oldVersion < 1 creating it.
              // This block might indicate a scenario where the DB was created by an older version that didn't have the store.
              // For robustness, ensure the store exists before trying to get it.
              db.createObjectStore(RESOURCE_STORE_NAME, { keyPath: "id" });
          }
          const store = transaction.objectStore(RESOURCE_STORE_NAME);
          // Check if index already exists before creating to prevent errors on re-upgrade attempts (though idb handles this well)
          if (!store.indexNames.contains('EVENT_ID')) {
              store.createIndex('EVENT_ID', 'EVENT_ID', { unique: false });
          }
      }
    },
  });
}

/**
 * Generic helper function to get all records from an IndexedDB object store.
 * @param {IDBPObjectStore} store The IDBPObjectStore from which to retrieve records.
 * @returns {Promise<Array<Object>>} A Promise that resolves with an array of all records in the store.
 */
export async function getAllFromStore(
  store // Type annotations removed. Generic <T> is not part of JS runtime.
) {
  // Use the idb library's getAll() method, which returns a Promise
  return store.getAll(); // Type assertion 'as Promise<T[]>' removed.
}