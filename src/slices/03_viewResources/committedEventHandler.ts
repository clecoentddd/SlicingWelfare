// src/handlers/commitEventHandler.ts
import type { StoredEvent } from "@/slices/shared/genericTypes"; // Assuming your genericTypes are here
import type { IDBPObjectStore } from 'idb'; // For IndexedDB object store type

// Re-using hasId from sharedProjections as it's a utility
import { hasId } from '../shared/sharedProjections'; // Assuming this utility is here

/**
 * Handles IncomeAdded and ExpenseAdded events to insert new entries into the resourceDB.
 * It will NOT update existing entries, preventing conflicts with the pushedEventHandler.
 * @param ev The StoredEvent (IncomeAdded or ExpenseAdded).
 * @param resourceStore The IDBPObjectStore for 'resources' from the current transaction.
 */
export async function commitEventHandler(ev: StoredEvent, resourceStore: IDBPObjectStore<unknown, ["resources"], "resources", "readwrite">): Promise<void> {
  if (!hasId(ev)) {
    console.error("Commit Event Handler: Event does not have an ID:", ev);
    return;
  }

  if (ev.type === "IncomeAdded" || ev.type === "ExpenseAdded") {
    const eventWithId = ev as { id: number } & typeof ev;
    const { changeId, description, amount, period } = ev.payload;
    const initialStatus = "Committed";

    const start = new Date(period.start);
    const end = new Date(period.end);
    const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

    const putRequests: Promise<any>[] = [];

    while (current <= last) {
      const month = `${(current.getUTCMonth() + 1).toString().padStart(2, '0')}-${current.getUTCFullYear()}`;
      const uniqueKey = `${eventWithId.id}-${month}`;

      const existingResource = await resourceStore.get(uniqueKey);

      if (!existingResource) {
        console.log(`Commit Event Handler: Inserting new resource: ${uniqueKey} with status: ${initialStatus}`);
        const resourceToPut = {
          id: uniqueKey,
          month,
          type: ev.type === "IncomeAdded" ? "Income" : "Expense",
          description,
          amount,
          changeId,
          status: initialStatus,
          timestamp: ev.timestamp
        };
        putRequests.push(
          resourceStore.add(resourceToPut) // Use .add() for strict insertion
            .then((key) => {
              console.log(`Commit Event Handler (Add Result): Successfully added new resource ID: ${resourceToPut.id} with key: ${key}. Data: ${JSON.stringify(resourceToPut)}`);
            })
            .catch(error => {
              if (error.name === 'ConstraintError') {
                console.warn(`Commit Event Handler (Add Error): Resource ID ${resourceToPut.id} already exists. Skipping insertion.`);
              } else {
                console.error(`Commit Event Handler (Add Error): Failed to add resource ID: ${resourceToPut.id}:`, error);
                throw error;
              }
            })
        );
      } else {
        console.log(`Commit Event Handler: Resource ${uniqueKey} already exists with status '${existingResource.status}'. Skipping insertion as per strict policy.`);
      }

      current.setUTCMonth(current.getUTCMonth() + 1);
    }

    await Promise.all(putRequests);
    console.log(`Commit Event Handler: All operations for event ${eventWithId.id} queued.`);
  }
}