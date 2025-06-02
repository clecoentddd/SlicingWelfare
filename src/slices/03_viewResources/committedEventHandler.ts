// src/03_viewResources/committedEventHandler.ts
import type { StoredEvent, EventWithId } from '../shared/genericTypes';
import type { AppDBSchema, Resource } from '../shared/openResourceDBListener';
import type { IDBPObjectStore } from 'idb';

const RESOURCE_STORE_NAME = "resources";

export async function commitEventHandler(
    event: EventWithId, // Event now guaranteed to have 'id'
    resourceStore: IDBPObjectStore<AppDBSchema, [typeof RESOURCE_STORE_NAME], typeof RESOURCE_STORE_NAME, "readwrite">
): Promise<void> {
    console.log(`Commit Handler: Processing event ${event.id}, type: ${event.type}`);

    if (event.type === "IncomeAdded" || event.type === "ExpenseAdded") {
        if (!event.payload || typeof event.payload.changeId !== 'string' || typeof event.payload.amount !== 'number' || !event.payload.period) {
            console.warn(`Commit Handler: Invalid payload for ${event.type} (missing changeId, amount, or period). Skipping.`);
            return;
        }

        const { changeId, amount, description, period } = event.payload;
        const putPromises: Promise<any>[] = []; // To collect all put operations

        // Iterate through each month in the specified period
        let currentMonthDate = new Date(period.start);
        const endDate = new Date(period.end);

        // Ensure currentMonthDate is at the start of its month to avoid issues with date arithmetic
        currentMonthDate.setDate(1); 
        
        // Loop while the current month is less than or equal to the end month
        // We compare year and month explicitly to handle end dates at the start of a month
        while (
            currentMonthDate.getFullYear() < endDate.getFullYear() ||
            (currentMonthDate.getFullYear() === endDate.getFullYear() && currentMonthDate.getMonth() <= endDate.getMonth())
        ) {
            const year = currentMonthDate.getFullYear();
            // Month is 0-indexed, so add 1 and pad with leading zero
            const month = (currentMonthDate.getMonth() + 1).toString().padStart(2, '0'); 
            const yearMonthString = `${month}-${year}`;
            // Construct the unique Resource ID: event.id + "-" + YYYY-MM
            const resourceId = `${event.id}-${yearMonthString}`;
            
            console.log(`Commit Handler: Preparing resource ${resourceId} for month ${yearMonthString}`);

            const newResource: Resource = {
                id: resourceId, // Unique ID for this specific monthly resource record
                description: description || 'Unknown', // Use payload description for resource description
                amount: amount,
                type: event.type === "IncomeAdded" ? "Income" : "Expense",
                timestamp: event.timestamp, // Original event timestamp
                
                // Properties derived from event.id and period
                month: yearMonthString, // The specific month for this resource record
                status: 'Committed', // All newly created resources start as 'Committed'
                EVENT_ID: event.id, // The ID of the event that created this set of resources
                changeId: changeId, // The changeId from the payload, used for indexing
            };

            // Queue the put operation; IndexedDB will overwrite if ID already exists
            putPromises.push(resourceStore.put(newResource));

            // Move to the next month
            currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
            // Ensure the date stays at the 1st of the month to prevent skipping months
            // e.g., if currentMonthDate was 2025-01-31 and you add 1 month, it might become 2025-03-02
            currentMonthDate.setDate(1);
        }

        // Await all queued put operations to complete
        await Promise.all(putPromises);
        console.log(`Commit Handler: Successfully processed and stored resources for event ${event.id} across its period.`);

    } else {
        console.warn(`Commit Handler: Received unhandled event type for commit: ${event.type}. Skipping.`);
    }
}