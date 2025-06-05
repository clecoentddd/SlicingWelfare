// src/slices/shared/openDecisionDB.js
import { openDB } from 'idb';

const DECISION_DB_NAME = "DecisionDB";
const DECISION_DB_VERSION = 2; // Increment the version number to trigger the upgrade
const DECISION_STORE_NAME = "decisions";

export async function openDecisionDB() {
  try {
    const db = await openDB(DECISION_DB_NAME, DECISION_DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading ${DECISION_DB_NAME} from version ${oldVersion} to ${newVersion}`);

        // Delete the existing object store if it exists
        if (db.objectStoreNames.contains(DECISION_STORE_NAME)) {
          db.deleteObjectStore(DECISION_STORE_NAME);
          console.log(`Deleted existing object store: ${DECISION_STORE_NAME}`);
        }

        // Create the object store with decisionId as the key path
        const store = db.createObjectStore(DECISION_STORE_NAME, { keyPath: "decisionId" });

        // Create indexes for the required fields
        store.createIndex('calculationId', 'calculationId', { unique: false });
        store.createIndex('changeId', 'changeId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });

        console.log(`Created object store: ${DECISION_STORE_NAME} with decisionId as the key path`);
      },
      blocked() {
        console.warn(`Database upgrade blocked for ${DECISION_DB_NAME}. Please close all tabs with this application.`);
      },
      blocking() {
        console.log(`New database version for ${DECISION_DB_NAME} is available, waiting for other connections to close.`);
      },
      terminated() {
        console.error(`Database connection for ${DECISION_DB_NAME} was terminated.`);
      }
    });
    console.log(`Successfully opened ${DECISION_DB_NAME}`);
    return db;
  } catch (error) {
    console.error(`Failed to open ${DECISION_DB_NAME}:`, error);
    throw error;
  }
}

export async function addToStore(store, value) {
  try {
    const result = await store.add(value);
    console.log('Successfully added to store:', result);
    return result;
  } catch (error) {
    console.error('Failed to add to store:', error);
    throw error;
  }
}

// Function to get all records from a given store
export async function getAllFromStore(store) {
  try {
    const result = await store.getAll();
    console.log('Retrieved records from store:', result);
    return result;
  } catch (error) {
    console.error('Error retrieving data from store:', error);
    throw error;
  }
}


export async function getAllChangeIdStatuses() {
  try {
    console.log('Opening DecisionDB...');
    const db = await openDecisionDB();
    console.log('DecisionDB opened successfully.');

    console.log('Starting transaction and accessing object store...');
    const tx = db.transaction(DECISION_STORE_NAME, 'readonly');
    const store = tx.objectStore(DECISION_STORE_NAME);

    console.log('Fetching all records from DecisionDB...');
    const decisions = await getAllFromStore(store);
    console.log(`Fetched ${decisions.length} records from DecisionDB.`);

    const changeIdMap = new Map();
    console.log('Processing records to map changeId to statuses...');

    decisions.forEach(decision => {
      const { changeId, status } = decision; // Use status instead of decisionTaken
      console.log(`Processing changeId: ${changeId} with status: ${status}`);
      if (!changeIdMap.has(changeId)) {
        changeIdMap.set(changeId, new Set([status]));
      } else {
        changeIdMap.get(changeId).add(status);
      }
    });

    console.log('Compiling changeId statuses...');
    const changeIdStatuses = {};
    changeIdMap.forEach((statuses, changeId) => {
      if (statuses.size === 1) {
        const status = Array.from(statuses)[0];
        changeIdStatuses[changeId] = status;
        console.log(`changeId: ${changeId} has consistent status: ${status}`);
      } else {
        console.warn(`changeId ${changeId} has inconsistent statuses:`, Array.from(statuses));
        changeIdStatuses[changeId] = 'Inconsistent';
      }
    });

    console.log('Finished processing DecisionDB data.');
    return changeIdStatuses;
  } catch (error) {
    console.error('Error fetching data from DecisionDB:', error);
    return { error: 'Error fetching data' };
  }
}
