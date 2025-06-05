import { openDB } from 'idb';

const RESOURCE_DB_NAME = "ResourceDB";
const RESOURCE_DB_VERSION = 3;
const RESOURCE_STORE_NAME = "resources";

export function openResourceDB() {
  return openDB(RESOURCE_DB_NAME, RESOURCE_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(RESOURCE_STORE_NAME)) {
        const store = db.createObjectStore(RESOURCE_STORE_NAME, { keyPath: "id" });
        store.createIndex('byMonth', 'month', { unique: false });
        store.createIndex('byStatus', 'status', { unique: false });
        store.createIndex('byChangeId', 'changeId', { unique: false });
        store.createIndex('EVENT_ID', 'EVENT_ID', { unique: false });
      }
    },
  });
}

export async function getAllFromStore(store) {
  try {
    const result = await store.getAll();
    console.log('Retrieved from ResourceDB:', result);
    return result;
  } catch (error) {
    console.error('Error retrieving data from ResourceDB store:', error);
    throw error;
  }
}

export async function getAllChangeIdStatuses() {
  try {
    const db = await openResourceDB();
    const tx = db.transaction(RESOURCE_STORE_NAME, 'readonly');
    const store = tx.objectStore(RESOURCE_STORE_NAME);
    const resources = await getAllFromStore(store);

    const changeIdMap = new Map();

    resources.forEach(resource => {
      const { changeId, status } = resource;
      if (!changeIdMap.has(changeId)) {
        changeIdMap.set(changeId, new Set([status]));
      } else {
        changeIdMap.get(changeId).add(status);
      }
    });

    const changeIdStatuses = {};
    changeIdMap.forEach((statuses, changeId) => {
      if (statuses.size === 1) {
        changeIdStatuses[changeId] = Array.from(statuses)[0];
      } else {
        console.warn(`changeId ${changeId} has inconsistent statuses:`, Array.from(statuses));
        changeIdStatuses[changeId] = 'Inconsistent';
      }
    });

    return changeIdStatuses;
  } catch (error) {
    console.error('Error fetching data from ResourceDB:', error);
    return { error: 'Error fetching data' };
  }
}
