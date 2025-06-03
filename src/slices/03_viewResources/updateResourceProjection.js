// src/03_viewResources/updateResourceProjection.js

const RESOURCE_STORE_NAME = "resources"; // Consistent constant

/**
 * Performs the actual database write operations to update the 'resources' projection.
 * This function processes events like 'IncomeAdded' or 'ExpenseAdded',
 * generates corresponding `Resource` entries for each month in the event's period,
 * and saves them into the provided `resourceStore`.
 *
 * This function is called by `handleEventForProjection` after a new event
 * has been determined to require a projection update.
 *
 * @param {Object} event The committed event (with its ID from EventDB) to process.
 * @param {Object} resourceStore The `IDBPObjectStore` for 'resources' in an active read-write transaction.
 * @returns {Promise<Array>} A promise that resolves with an array of `Resource` objects that were
 * created or updated during this operation.
 */
export async function updateResourceProjection(event, resourceStore) {
    console.log(`Resource Projection Updater: Processing event ${event.id}, type: ${event.type}`);

    const affectedResources = []; // Collects all Resource objects that will be put into the DB

    if (event.type === "IncomeAdded" || event.type === "ExpenseAdded") {
        // Validate event payload for necessary properties
        if (!event.payload || typeof event.payload.changeId !== 'string' || typeof event.payload.amount !== 'number' || !event.payload.period) {
            console.warn(`Resource Projection Updater: Invalid payload for ${event.type} (missing changeId, amount, or period). Skipping.`);
            return [];
        }

        const { changeId, amount, description, period } = event.payload;
        const putPromises = []; // To hold all IndexedDB `put` promises

        let currentMonthDate = new Date(period.start);
        const endDate = new Date(period.end);

        currentMonthDate.setDate(1); // Set to the 1st of the month to ensure correct month iteration

        // Loop through each month within the specified period
        while (
            currentMonthDate.getFullYear() < endDate.getFullYear() ||
            (currentMonthDate.getFullYear() === endDate.getFullYear() && currentMonthDate.getMonth() <= endDate.getMonth())
        ) {
            const year = currentMonthDate.getFullYear();
            // Month is 0-indexed, so add 1 and pad with a leading zero if necessary
            const month = (currentMonthDate.getMonth() + 1).toString().padStart(2, '0');
            const yearMonthString = `${month}-${year}`; // Format: MM-YYYY (e.g., "01-2025")

            // Create a unique ID for each monthly resource record: Event ID + Month
            const resourceId = `${event.id}-${yearMonthString}`;

            const newResource = {
                id: resourceId, // Unique ID for this specific monthly resource record
                description: description || 'Unknown', // Use description from event payload
                amount: amount,
                type: event.type === "IncomeAdded" ? "Income" : "Expense",
                timestamp: event.timestamp, // Use the original event's timestamp
                month: yearMonthString, // The specific month for this resource record
                status: 'Committed', // All newly created resources start as 'Committed'
                EVENT_ID: event.id, // Reference the ID of the original event
                changeId: changeId, // Reference the changeId from the event payload
            };

            // Queue the `put` operation. `put` will add a new record or overwrite if `id` already exists.
            putPromises.push(resourceStore.put(newResource));
            affectedResources.push(newResource); // Add to our list to be returned

            // Move to the first day of the next month
            currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
            currentMonthDate.setDate(1);
        }

        // Wait for all IndexedDB `put` operations to complete.
        await Promise.all(putPromises);
        console.log(`Resource Projection Updater: Successfully stored ${affectedResources.length} resources for event ${event.id}.`);
        return affectedResources; // Return the list of resources that were created/updated

    } else {
        // Log a warning if the event type is not handled by this projection updater
        console.warn(`Resource Projection Updater: Received unhandled event type for resource projection: ${event.type}. Skipping.`);
        return []; // Return an empty array if no resources were affected
    }
}
