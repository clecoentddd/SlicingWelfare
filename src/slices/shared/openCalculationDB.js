// src/slices/shared/openCalculationDB.js

import { openDB } from 'idb';

const CALCULATION_DB_NAME = "CalculationDB";
const CALCULATION_DB_VERSION = 2; // Increment the version number to trigger an upgrade
const CALCULATION_STORE_NAME = "monthlyCalculations";

export function openCalculationDB() {
  return openDB(CALCULATION_DB_NAME, CALCULATION_DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

      // Delete the existing store if it exists to avoid conflicts during development
      if (db.objectStoreNames.contains(CALCULATION_STORE_NAME)) {
        console.log(`Deleting existing object store: ${CALCULATION_STORE_NAME}`);
        db.deleteObjectStore(CALCULATION_STORE_NAME);
      }

      // Create the 'monthlyCalculations' object store with 'id' as the key path
      console.log(`Creating object store: ${CALCULATION_STORE_NAME} with keyPath 'id'`);
      const store = db.createObjectStore(CALCULATION_STORE_NAME, { keyPath: "id" });

      // Create indexes if necessary
      console.log(`Creating indexes for object store: ${CALCULATION_STORE_NAME}`);
      store.createIndex('byMonth', 'month', { unique: false });
      store.createIndex('byChangeId', 'changeId', { unique: false });
      store.createIndex('byCalculationId', 'calculationId', { unique: false });
      store.createIndex('byTimestamp', 'timestamp', { unique: false });
      store.createIndex('byStatus', 'status', { unique: false }); 
    },
  });
}

export async function addToStore(store, value) {
  console.log(`Adding record to store: ${JSON.stringify(value)}`);
  return store.add(value);
}

export async function getAllFromStore(store) {
  return store.getAll();
}
