// src/03_viewResources/handleEventForProjection.js

import { openResourceDB } from '../shared/openResourceDB';
import { updateResourceProjection } from './updateResourceProjection';

const RESOURCE_STORE_NAME = "resources"; // Consistent constant for the resource object store

/**
 * Finds the highest EVENT_ID currently stored in the 'resources' object store.
 * This is used to determine if an incoming event is newer than the current projection.
 *
 * @param {Object} store The IDBPObjectStore for 'resources' (within a transaction).
 * @returns {Promise<number>} A Promise that resolves with the highest EVENT_ID found, or 0 if the store is empty or an error occurs.
 */
async function getHighestEventIdInResourceDB(store) {
    let highestId = 0;
    try {
        // Open a cursor on the EVENT_ID index, iterating in reverse to find the largest ID quickly.
        const cursor = await store.index('EVENT_ID').openCursor(null, 'prev');
        if (cursor && typeof cursor.value.EVENT_ID === 'number') {
            highestId = cursor.value.EVENT_ID;
        }
    } catch (error) {
        console.error("Error getting highest EVENT_ID from ResourceDB:", error);
        // If there's an issue (e.g., index missing, DB corrupted), return 0 to allow new projections.
        return 0;
    }
    return highestId;
}

/**
 * Entry point for projection updates.
 *
 * This function orchestrates the projection of a committed event into the ResourceDB.
 * It first checks if the incoming event's ID is newer than the latest event already
 * processed in the ResourceDB. If it is, it triggers the actual database write
 * operations via `updateResourceProjection`.
 *
 * This function is designed to be called by `slice_02` after an event has been
 * successfully committed to the EventDB.
 *
 * @param {Object} committedEvent The event (with its auto-generated `id` from the EventDB)
 * that needs to be projected.
 * @returns {Promise<Array>} A Promise that resolves with an array of `Resource` objects that were
 * created or updated in the `ResourceDB`, or an empty array if no update
 * was needed (i.e., the projection was already up-to-date for this event).
 */
export async function handleEventForProjection(committedEvent) {
    console.log(`Projection Coordinator: Receiving event ${committedEvent.id} for projection check.`);
    let affectedResources = []; // To store resources created/updated

    try {
        const db = await openResourceDB();
        // Open a read-write transaction as we might be updating the DB
        const tx = db.transaction(RESOURCE_STORE_NAME, "readwrite");
        const resourceStore = tx.objectStore(RESOURCE_STORE_NAME);

        // Get the current highest EVENT_ID within the scope of this transaction.
        // This ensures consistency for the comparison.
        const currentHighestEventId = await getHighestEventIdInResourceDB(resourceStore);
        console.log(`Projection Coordinator: Current highest EVENT_ID in ResourceDB: ${currentHighestEventId}`);

        // Check if the incoming event is newer than the highest ID in the projection.
        if (committedEvent.id > currentHighestEventId) {
            console.log(`Projection Coordinator: Event ${committedEvent.id} is newer. Triggering projection update.`);

            // Call the function responsible for the actual database write operations.
            affectedResources = await updateResourceProjection(committedEvent, resourceStore);

            // Crucially, wait for the transaction to complete, persisting all changes.
            await tx.done;
            console.log(`Projection Coordinator: Projection for event ${committedEvent.id} completed successfully.`);
        } else {
            console.log(`Projection Coordinator: Event ${committedEvent.id} is not newer or projection is up-to-date. Skipping update.`);
            // If no writes were performed, it's good practice to explicitly abort the transaction.
            tx.abort();
        }
    } catch (error) {
        console.error(`❌ Projection Coordinator: Error during projection for event ${committedEvent.id}:`, error);
        // Re-throw the error to indicate failure to the caller (slice_02).
        throw error;
    }
    return affectedResources; // Return the resources that were actually updated/created
}
