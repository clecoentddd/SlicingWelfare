// src/utils/openResourceDB.ts

import { openDB, IDBPDatabase } from 'idb';

const RESOURCE_DB_NAME = "ResourceDB";
const RESOURCE_DB_VERSION = 2; // Increment the version number to trigger the upgrade
const RESOURCE_STORE_NAME = "resources";

export function openResourceDB(): Promise<IDBPDatabase<unknown>> {
  return openDB(RESOURCE_DB_NAME, RESOURCE_DB_VERSION, {
    upgrade(db: IDBPDatabase<unknown>) {
      if (!db.objectStoreNames.contains(RESOURCE_STORE_NAME)) {
        const store = db.createObjectStore(RESOURCE_STORE_NAME, {
          keyPath: "id",
        });

        // Create indexes if they don't exist
        if (!store.indexNames.contains('byMonth')) {
          store.createIndex('byMonth', 'month', { unique: false });
        }
        if (!store.indexNames.contains('byStatus')) {
          store.createIndex('byStatus', 'status', { unique: false });
        }
        if (!store.indexNames.contains('byChangeId')) {
          store.createIndex('byChangeId', 'changeId', { unique: false });
        }
      }
    },
  });
}