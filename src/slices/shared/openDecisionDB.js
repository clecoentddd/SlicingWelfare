// src/slices/shared/openDecisionDB.js

import { openDB } from 'idb';

const DECISION_DB_NAME = "DecisionDB";
const DECISION_DB_VERSION = 1;
const DECISION_STORE_NAME = "decisions";

export function openDecisionDB() {
  return openDB(DECISION_DB_NAME, DECISION_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(DECISION_STORE_NAME)) {
        const store = db.createObjectStore(DECISION_STORE_NAME, { keyPath: "id" });
        store.createIndex('byChangeId', 'changeId', { unique: false });
        store.createIndex('byCalculationId', 'calculationId', { unique: false });
        store.createIndex('byDecisionTaken', 'decisionTaken', { unique: false });
      }
    },
  });
}

export async function addToStore(store, value) {
  return store.add(value);
}
