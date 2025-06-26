// src/slices/03_viewResources/queryResourceProjection.js

import { openResourceDB } from "../shared/openResourceDB.js";

const RESOURCE_STORE_NAME = "resources";
const subscribers = new Set();

/**
 * Notify all subscribers with fresh data
 */
async function notifySubscribers() {
  const data = await queryResourceProjection();
  subscribers.forEach(callback => callback(data));
}

/**
 * Queries the 'resources' projection from IndexedDB.
 */
export async function queryResourceProjection() {
  try {
    const db = await openResourceDB();
    const tx = db.transaction(RESOURCE_STORE_NAME, "readonly");
    const store = tx.objectStore(RESOURCE_STORE_NAME);

    const result = await store.getAll();

    // Combined sort - Primary by Month (Desc), Secondary by Timestamp (Desc)
    result.sort((a, b) => {
      const monthComparison = b.month.localeCompare(a.month);
      if (monthComparison !== 0) {
        return monthComparison;
      }
      return b.timestamp - a.timestamp;
    });

    return result;
  } catch (err) {
    console.error(`❌ Failed to query '${RESOURCE_STORE_NAME}' projection:`, err);
    return [];
  }
}

/**
 * Subscribe to resource updates
 * @param {Function} callback - Called with new data when resources change
 * @returns {Function} Unsubscribe function
 */
export function subscribeToResourceUpdates(callback) {
  subscribers.add(callback);
  
  // Initial data load
  queryResourceProjection().then(callback);
  
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Call this whenever resources are modified to notify subscribers
 */
export function notifyResourceChanged() {
  notifySubscribers();
}