// src/03_viewResources/updateResourceProjection.js

const RESOURCE_STORE_NAME = "resources";

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

    const affectedResources = [];

    if (event.type === "IncomeAdded" || event.type === "ExpenseAdded") {
        // Validate event structure, now expecting changeId at the top level
        if (
            !event.payload ||
            typeof event.payload.amount !== 'number' ||
            !event.payload.period ||
            typeof event.changeId !== 'string' // FIX: Check changeId directly on the event object
        ) {
            console.warn(`Resource Projection Updater: Invalid event structure for ${event.type}. Missing 'amount', 'period' in payload, or top-level 'changeId'. Skipping.`);
            return [];
        }

        // Extract properties from payload AND the top level event object
        const { amount, description, period } = event.payload;
        const { changeId } = event; // FIX: Get changeId directly from the event object

        const putPromises = [];

        // Parse and validate start and end dates
        let currentMonthDate = new Date(period.start);
        const endDate = new Date(period.end);

        // ADDED LOGS FOR DEBUGGING START/END DATES
        console.log(`Projection Debug: Raw Period Start: '${period.start}' -> Parsed Date: ${currentMonthDate}`);
        console.log(`Projection Debug: Raw Period End: '${period.end}' -> Parsed Date: ${endDate}`);

        if (isNaN(currentMonthDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn(`Resource Projection Updater: Invalid start or end date for ${event.type}. Skipping.`);
            return [];
        }
        if (currentMonthDate.getTime() > endDate.getTime()) {
            console.warn(`Resource Projection Updater: Start date (${currentMonthDate.toISOString()}) is after end date (${endDate.toISOString()}) for ${event.type}. Skipping.`);
            return [];
        }

        currentMonthDate.setDate(1); // Set to the 1st of the month for consistent iteration

        // Loop through each month within the specified period
        while (
            currentMonthDate.getFullYear() < endDate.getFullYear() ||
            (currentMonthDate.getFullYear() === endDate.getFullYear() && currentMonthDate.getMonth() <= endDate.getMonth())
        ) {
            const year = currentMonthDate.getFullYear();
            const month = (currentMonthDate.getMonth() + 1).toString().padStart(2, '0');
            const yearMonthString = `${month}-${year}`;

            const resourceId = `${event.id}-${yearMonthString}`;

            const newResource = {
                id: resourceId,
                description: description || 'Unknown',
                amount: amount,
                type: event.type === "IncomeAdded" ? "Income" : "Expense",
                timestamp: event.timestamp,
                month: yearMonthString, // The specific month for this resource record
                status: 'Committed',
                EVENT_ID: event.id,
                changeId: changeId, // This is now correctly from the top-level event property
            };

            putPromises.push(resourceStore.put(newResource));
            affectedResources.push(newResource);

            currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
            currentMonthDate.setDate(1);
        }

        await Promise.all(putPromises);
        console.log(`Resource Projection Updater: Successfully stored ${affectedResources.length} resources for event ${event.id}.`);
        return affectedResources;

    } else {
        console.warn(`Resource Projection Updater: Received unhandled event type for resource projection: ${event.type}. Skipping.`);
        return [];
    }
}