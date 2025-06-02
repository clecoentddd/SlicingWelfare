// src/handlers/pushedEventHandler.ts
import { openResourceDB } from "../03_viewResources/openResourceDB"; // Still needed for the post-transaction verification read
import type { StoredEvent } from "@/slices/shared/genericTypes"; // Assuming your genericTypes are here
import type { IDBPObjectStore } from 'idb'; // For IndexedDB object store type

// Re-using hasId from sharedProjections as it's a utility
import { hasId } from '../shared/sharedProjections'; // Assuming this utility is here

/**
 * Handles ChangePushed events to update resource statuses from "Committed" to "Pushed".
 * @param ev The StoredEvent (ChangePushed).
 * @param resourceStore The IDBPObjectStore for 'resources' from the current transaction.
 */
export async function pushedEventHandler(ev: StoredEvent, resourceStore: IDBPObjectStore<unknown, ["resources"], "resources", "readwrite">): Promise<void> {
  if (ev.type === "ChangePushed" && hasId(ev)) {
    const eventWithId = ev as { id: number } & typeof ev;
    // console.log(`--- Pushed Event Handler: Processing ChangePushed event with ID: ${eventWithId.id} and timestamp: ${eventWithId.timestamp} ---`);
    const { changeId } = ev.payload;

    const index = resourceStore.index("byChangeId");

    // console.log(`Pushed Event Handler: Fetching resources for changeId: ${changeId} BEFORE update attempt (Event ID: ${eventWithId.id}).`);
    const resourcesBeforeUpdate = await index.getAll(IDBKeyRange.only(changeId));
    // console.log(`Pushed Event Handler: Found ${resourcesBeforeUpdate.length} resources for changeId: ${changeId} (BEFORE update, Event ID: ${eventWithId.id}). Details:`, JSON.stringify(resourcesBeforeUpdate, null, 2));

    const putRequests: Promise<any>[] = [];
    const updatedResourceIds: string[] = [];
    let resourcesMeetingCriteria = 0;

    for (const resource of resourcesBeforeUpdate) {
      const resourceIdPart = resource.id.split('-')[0];

      const condition1 = (resource.status === "Committed");
      const condition2 = (parseInt(resourceIdPart) < eventWithId.id); // Using ID comparison as discussed

      // console.log(`Pushed Event Handler: Checking resource ID: ${resource.id} (status: ${resource.status}, idPart: ${resourceIdPart}) against ChangePushed event ID: ${eventWithId.id}.`);
      // console.log(`  Condition 1 (status === "Committed"): ${condition1}`);
      // console.log(`  Condition 2 (idPart < event ID): ${condition2} (${parseInt(resourceIdPart)} < ${eventWithId.id})`);

      if (condition1 && condition2) {
        resourcesMeetingCriteria++;
        // console.log(`Pushed Event Handler: Criteria MET for resource with full ID: ${resource.id}. Preparing to update.`);
        const updatedResource = { ...resource, status: "Pushed" };
        updatedResourceIds.push(updatedResource.id);

        const primaryKey = updatedResource.id;
        // console.log(`Pushed Event Handler: Attempting to put (update) resource with primary key: ${primaryKey} to status: ${updatedResource.status}`);

        const putOperationPromise = resourceStore.put(updatedResource)
            .then((key) => {
                //console.log(`Pushed Event Handler (Put Result): Successfully queued update for resource ID: ${updatedResource.id} with key: ${key}. Data: ${JSON.stringify(updatedResource)}`);
                return key;
            })
            .catch(error => {
                console.error(`Pushed Event Handler (Put Error): Failed to queue update for resource ID: ${updatedResource.id} with key: ${primaryKey}. Error:`, error);
                throw error;
            });
        putRequests.push(putOperationPromise);

      } else {
       // console.log(`Pushed Event Handler: Skipping resource with full ID: ${resource.id} (criteria NOT met).`);
      }
    }

    if (putRequests.length > 0) {
      // console.log(`Pushed Event Handler (Event ID ${eventWithId.id}): Queued ${putRequests.length} updates for resources meeting criteria (${resourcesMeetingCriteria}).`);
      await Promise.all(putRequests);
      // console.log(`Pushed Event Handler (Event ID ${eventWithId.id}): All individual put operations for this event successfully queued.`);
    } else {
      // console.log(`Pushed Event Handler (Event ID ${eventWithId.id}): No resources met criteria for update. No operations queued.`);
    }

    // --- Post-transaction verification read (optional, for debugging) ---
    // This *still* needs a new read-only transaction, as the 'write' transaction is managed higher up in page.tsx
if (updatedResourceIds.length > 0) {
    const verificationDB = await openResourceDB(); // Open a new DB connection for verification
    const verificationTx = verificationDB.transaction("resources", "readonly");
    const verificationStore = verificationTx.objectStore("resources");
    const verifiedResources: any[] = [];

    try {
        for (const id of updatedResourceIds) {
            const request = verificationStore.get(id);
            const resource = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            verifiedResources.push(resource);
        }
        // The transaction will automatically commit when it goes out of scope
        console.log(`Pushed Event Handler: Verified resource states AFTER commit (Event ID: ${eventWithId.id}):`, JSON.stringify(verifiedResources, null, 2));
    } catch (verifError) {
        console.error(`Pushed Event Handler (Verification Error): Failed to verify resources for Event ID ${eventWithId.id}:`, verifError);
    }
    } else {
        console.log(`Pushed Event Handler: No resources were updated for event ID ${eventWithId.id}, skipping verification read.`);
    }
  }
}