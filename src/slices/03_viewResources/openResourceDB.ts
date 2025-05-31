// src/utils/openResourceDB.ts

// src/config/dbConstants.ts
const RESOURCE_DB_NAME = "ResourceDB";
const RESOURCE_DB_VERSION = 1;
 const RESOURCE_STORE_NAME = "resources";


export function openResourceDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RESOURCE_DB_NAME, RESOURCE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(RESOURCE_STORE_NAME)) {
        const store = db.createObjectStore(RESOURCE_STORE_NAME, {
          keyPath: ["month", "changeId", "description", "type"], // ensure uniqueness
        });

        store.createIndex("byMonth", "month");
        store.createIndex("byStatus", "status");
        store.createIndex("byChangeId", "changeId");
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

 export function getAllFromStore<T>(store: IDBObjectStore): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }
  