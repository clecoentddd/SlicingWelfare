// src/slices/shared/openResourceDBListener.ts (assuming this is its location)

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';

const RESOURCE_DB_NAME = "ResourceDB";
const RESOURCE_DB_VERSION = 3;
const RESOURCE_STORE_NAME = "resources";

// --- 1. Define the Resource interface ---
// This specifies the exact structure of objects stored in your 'resources' object store.
// I've included properties that appear in your committedEventHandler and pushedEventHandler.
export interface Resource {
  id: string; // The primary key (e.g., "eventId-month")
  month: string;
  type: 'Income' | 'Expense'; // Maps from IncomeAdded/ExpenseAdded event types
  description: string;
  amount: number;
  changeId?: string; // Optional, used for ChangePushed events
  status: 'Committed' | 'Pushed'; // The statuses you're using for projection
  timestamp: number; // The timestamp of the event that created/modified it
  EVENT_ID: number; // The ID of the original event (as used in handlers)
}

// --- 2. Define the AppDBSchema interface ---
// This extends DBSchema from 'idb' and provides strong typing for your database.
export interface AppDBSchema extends DBSchema {
  resources: {
    key: string; // The type of the keyPath ('id' property, which is a string)
    value: Resource; // The type of the objects stored in this object store
    indexes: {
      byMonth: string;
      byStatus: 'Committed' | 'Pushed'; // Match the literal types from Resource status
      byChangeId: string;
      EVENT_ID: number; // Match the type of EVENT_ID in Resource
    };
  };
  // Add other object stores here if your DB grows (e.g., 'events' or 'metadata' would go in openEventDB's schema)
}

// --- 3. Function to open the database using the idb library ---
// RENAMED: to match 'openResourceDBWithIdb' import from your unifiedListener.ts
export function openResourceDBWithIdb(): Promise<IDBPDatabase<AppDBSchema>> {
  return openDB<AppDBSchema>(RESOURCE_DB_NAME, RESOURCE_DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // The 'db' and 'transaction' parameters are now correctly typed with AppDBSchema
      // without needing explicit ': IDBPDatabase<AppDBSchema>' annotations.

      if (oldVersion < 1) {
        // If the database is being created for the first time (or upgrading from 0)
        // Ensure the object store and all indexes are created.
        const store = db.createObjectStore(RESOURCE_STORE_NAME, {
          keyPath: "id",
        });
        store.createIndex('byMonth', 'month', { unique: false });
        store.createIndex('byStatus', 'status', { unique: false });
        store.createIndex('byChangeId', 'changeId', { unique: false });
        store.createIndex('EVENT_ID', 'EVENT_ID', { unique: false });
      }

      // If upgrading to version 3, ensure the EVENT_ID index exists.
      // This handles cases where oldVersion might be 1 or 2, and EVENT_ID was added later.
      if (oldVersion < 3) {
          // Check if the store already exists (it should if oldVersion is not 0)
          if (db.objectStoreNames.contains(RESOURCE_STORE_NAME)) {
              const store = transaction.objectStore(RESOURCE_STORE_NAME);
              if (!store.indexNames.contains('EVENT_ID')) {
                  store.createIndex('EVENT_ID', 'EVENT_ID', { unique: false });
              }
              // You might want to re-check other indexes here if you had complex versioning where they might be missing
              // For example:
              // if (!store.indexNames.contains('byMonth')) { store.createIndex('byMonth', 'month', { unique: false }); }
          }
      }
    },
  });
}