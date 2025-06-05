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

export async function getAllChangeIdStatuses() {
  try {
    console.log('Opening CalculationDB...');
    const db = await openCalculationDB();
    console.log('CalculationDB opened successfully.');

    const tx = db.transaction(CALCULATION_STORE_NAME, 'readonly');
    const store = tx.objectStore(CALCULATION_STORE_NAME);
    console.log('Fetching all records from CalculationDB...');
    const calculations = await getAllFromStore(store);

    // Log each calculation entry to verify the structure
    calculations.forEach((calculation, index) => {
      console.log(`Calculation Entry ${index}:`, calculation);
    });

    const changeIdMap = new Map();

    calculations.forEach(calculation => {
      const { changeId, type } = calculation;
      console.log(`Processing changeId: ${changeId} with type: ${type}`);
      if (!changeIdMap.has(changeId)) {
        changeIdMap.set(changeId, new Set([type]));
      } else {
        changeIdMap.get(changeId).add(type);
      }
    });

    const changeIdStatuses = {};
    changeIdMap.forEach((types, changeId) => {
      if (types.size === 1) {
        const type = Array.from(types)[0];
        changeIdStatuses[changeId] = type;
        console.log(`changeId: ${changeId} has consistent type: ${type}`);
      } else {
        console.warn(`changeId ${changeId} has inconsistent types:`, Array.from(types));
        changeIdStatuses[changeId] = 'Inconsistent';
      }
    });

    console.log('Finished processing CalculationDB data.');
    return changeIdStatuses;
  } catch (error) {
    console.error('Error fetching data from CalculationDB:', error);
    return { error: 'Error fetching data' };
  }
}