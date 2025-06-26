import { openResourceDB } from '../shared/openResourceDB.js';
import {notifyResourceChanged } from '../03_viewResources/queryResourceProjection.js';

const RESOURCE_STORE_NAME = "resources";

export async function updatedProjectionWithDataCancelled(ev) {
  const { changeId } = ev;
  const currentEventNumericId = ev.id;

  console.log(`Cancelled Handler: Processing cancellation for changeId: ${changeId}`);

  try {
    const db = await openResourceDB();
    console.log(`Cancelled Handler: Database opened successfully`);

    const tx = db.transaction(RESOURCE_STORE_NAME, "readwrite");
    const resourceStore = tx.objectStore(RESOURCE_STORE_NAME);

    if (!resourceStore.indexNames.contains('byChangeId')) {
      throw new Error(`Index 'byChangeId' not found in resource store`);
    }

    const index = resourceStore.index("byChangeId");
    const resourcesToProcess = await index.getAll(IDBKeyRange.only(changeId));
    console.log(`Cancelled Handler: Found ${resourcesToProcess.length} resources for changeId: ${changeId}`);

    const deleteOperations = [];
    const deletedResourceIds = [];

    for (const resource of resourcesToProcess) {
      console.log(`Cancelled Handler: Evaluating resource ${resource.id} with status: ${resource.status}`);

      // Only delete if resource is committed and event ID is older than cancellation
      const isCommitted = resource.status === "Committed";
      const resourceEventId = Number(resource.EVENT_ID || 0);
      const isOlderEvent = resourceEventId < currentEventNumericId;

      if (isCommitted && isOlderEvent) {
        deleteOperations.push(
          resourceStore.delete(resource.id).catch(error => {
            console.error(`Failed to delete resource ${resource.id}:`, error);
            throw error;
          })
        );
        deletedResourceIds.push(resource.id);
        console.log(`Cancelled Handler: Queued deletion for resource ${resource.id}`);
      }
    }

    await Promise.all(deleteOperations);
    await tx.done;

    notifyResourceChanged();

    console.log(`Cancelled Handler: Successfully deleted ${deletedResourceIds.length} resources. Deleted IDs:`, deletedResourceIds);
    return deletedResourceIds;

  } catch (error) {
    console.error(`Cancelled Handler: Critical error processing cancellation:`, error);
    throw error;
  }
}