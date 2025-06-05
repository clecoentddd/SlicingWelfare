    // src/slices/03_viewResources/queryResourceProjection.js

import { openResourceDB } from "../shared/openResourceDB.js"; // Assuming this path is correct for openResourceDB

const RESOURCE_STORE_NAME = "resources";

/**
 * Queries the 'resources' projection from IndexedDB.
 * This function encapsulates the database interaction, allowing UI components
 * to retrieve projected data without direct knowledge of IndexedDB.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of
 * sorted resource objects, or an empty array if an error occurs.
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
    return []; // Return an empty array on error
  }
}