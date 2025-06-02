// src/05_updateChangesToPushed/pushedEventHandler.ts
import { openResourceDBWithIdb, type AppDBSchema, type Resource } from '../shared/openResourceDBListener';
import type { EventWithId } from '../shared/genericTypes';
import type { IDBPObjectStore } from 'idb';
import { hasId } from '../shared/sharedProjections';

const RESOURCE_STORE_NAME = "resources";

/**
 * Handles ChangePushed events to update resource statuses.
 * It finds all 'Committed' resources associated with the event's changeId
 * and updates their status to 'Pushed' if they are older than the current event.
 *
 * @param ev The ChangePushed event, guaranteed to have an 'id'.
 * @param resourceStore The 'resources' object store from the current transaction.
 */
export async function pushedEventHandler(
  ev: EventWithId,
  resourceStore: IDBPObjectStore<AppDBSchema, [typeof RESOURCE_STORE_NAME], typeof RESOURCE_STORE_NAME, "readwrite">
): Promise<void> {
  console.log(`Pushed Handler: Processing event ${ev.id}, type: ${ev.type}`);

  if (ev.type === "ChangePushed" && hasId(ev)) {
    const { changeId, status } = ev.payload;
    const currentEventId = ev.id;

    console.log(`Pushed Handler: Updating resources for changeId: ${changeId} based on event ID: ${currentEventId}`);

    const index = resourceStore.index("byChangeId");
    const resourcesToProcess = await index.getAll(IDBKeyRange.only(changeId));

    const putOperations: Promise<any>[] = [];
    const updatedResourceIds: string[] = [];

    for (const resource of resourcesToProcess) {
      // Update if resource is 'Committed' AND it was last updated by an event older than the current one
      if (resource.status === "Committed" && resource.EVENT_ID < currentEventId) {
        const updatedResource: Resource = {
          ...resource,
          status: status, // Should be "Pushed" from the event payload
          timestamp: ev.timestamp, // Update resource's timestamp to the current event's
          EVENT_ID: currentEventId, // Record which event caused this update
        };
        updatedResourceIds.push(updatedResource.id);
        putOperations.push(
          resourceStore.put(updatedResource).catch(error => {
            console.error(`Pushed Handler: Failed to put resource ${updatedResource.id}. Error:`, error);
            throw error; // Re-throw to propagate transaction failure
          })
        );
      } else {
        // Log if a resource doesn't meet the update criteria
        console.log(`Pushed Handler: Resource ${resource.id} (status: ${resource.status}, EVENT_ID: ${resource.EVENT_ID}) did not meet update criteria for event ${currentEventId}.`);
      }
    }

    if (putOperations.length > 0) {
      console.log(`Pushed Handler: Attempting to update ${putOperations.length} resources for changeId ${changeId}.`);
      await Promise.all(putOperations);
      console.log(`Pushed Handler: All updates for changeId ${changeId} completed.`);
    } else {
      console.log(`Pushed Handler: No resources met update criteria for changeId ${changeId} and event ${currentEventId}.`);
    }

    // --- Post-transaction verification ---
    // This step ensures the state is as expected after the transaction has committed.
    if (updatedResourceIds.length > 0) {
      console.log(`Pushed Handler: Verifying updated resources.`);
      const verificationDB = await openResourceDBWithIdb();
      const verificationTx = verificationDB.transaction(RESOURCE_STORE_NAME, "readonly");
      const verificationStore = verificationTx.objectStore(RESOURCE_STORE_NAME);

      try {
        const verifiedResources: Resource[] = [];
        for (const id of updatedResourceIds) {
          const resource = await verificationStore.get(id);
          if (resource) {
            verifiedResources.push(resource);
          } else {
            console.warn(`Pushed Handler (Verification): Resource ID ${id} not found.`);
          }
        }
        console.log(`Pushed Handler: Verified resource states after push (Event ID: ${currentEventId}):`, JSON.stringify(verifiedResources, null, 2));
      } catch (verifError) {
        console.error(`Pushed Handler (Verification Error): Failed to verify resources for Event ID ${currentEventId}:`, verifError);
      }
    } else {
      console.log(`Pushed Handler: No resources were updated, skipping verification.`);
    }
  } else {
    console.warn(`Pushed Handler: Received unexpected event type '${ev.type}' or event without ID. Skipping.`);
  }
}