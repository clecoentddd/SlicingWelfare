// Import the database opener from your shared slice
import { openResourceDB } from '../shared/openResourceDB.js'; // Ensure this path is correct

// Define the store name here, as it's not exported from openResourceDB.js
const RESOURCE_STORE_NAME = "resources"; // This must match the name used in openResourceDB.js

export async function updatedProjectionWithDataPushed(ev) {
  const { changeId } = ev; // Get changeId directly from the event object
  const { status } = ev.payload; // Get status from the event's payload
  const currentEventNumericId = ev.id; // Use the numeric 'id' field for comparison
  const currentEventId = ev.eventId; // Using the UUID as the unique event identifier

  console.log(`Pushed Handler: Starting to update resources for changeId: ${changeId} based on event ID: ${currentEventId}`);

  try {
    const db = await openResourceDB();
    console.log(`Pushed Handler: Successfully opened the database.`);

    const tx = db.transaction(RESOURCE_STORE_NAME, "readwrite");
    const resourceStore = tx.objectStore(RESOURCE_STORE_NAME);

    if (!resourceStore.indexNames.contains('byChangeId')) {
      console.error(`Pushed Handler: Index 'byChangeId' not found on resource store '${RESOURCE_STORE_NAME}'.`);
      throw new Error(`IndexedDB index 'byChangeId' not found in resource store.`);
    }

    const index = resourceStore.index("byChangeId");
    const resourcesToProcess = await index.getAll(IDBKeyRange.only(changeId));
    console.log(`Pushed Handler: Found ${resourcesToProcess.length} resources to process for changeId: ${changeId}.`);

    const putOperations = [];
    const updatedResourceIds = [];

    for (const resource of resourcesToProcess) {
      console.log(`Pushed Handler: Evaluating resource ${resource.id} with status: ${resource.status} and EVENT_ID: ${resource.EVENT_ID}.`);

      const meetsStatusCriteria = resource.status === "Committed";
      const resourceEventId = resource.EVENT_ID !== undefined ? Number(resource.EVENT_ID) : undefined;
      const currentEventNumericIdNumber = Number(currentEventNumericId);
      const meetsEventIdCriteria = resourceEventId === undefined || resourceEventId < currentEventNumericIdNumber;

      console.log(`Criteria for resource ${resource.id}:`);
      console.log(`- Status is "Committed": ${meetsStatusCriteria}`);
      console.log(`- Resource EVENT_ID (converted to number): ${resourceEventId}`);
      console.log(`- Current Event Numeric ID (converted to number): ${currentEventNumericIdNumber}`);
      console.log(`- Is EVENT_ID undefined or less than currentEventNumericId: ${meetsEventIdCriteria}`);

      if (meetsStatusCriteria && meetsEventIdCriteria) {
        const updatedResource = {
          ...resource,
          status: status,
          timestamp: ev.timestamp,
          EVENT_ID: currentEventNumericId, // Use the numeric ID for updating
        };
        updatedResourceIds.push(updatedResource.id);
        putOperations.push(
          resourceStore.put(updatedResource).catch(error => {
            console.error(`Pushed Handler: Failed to put resource ${updatedResource.id}. Error:`, error);
            throw error;
          })
        );
        console.log(`Pushed Handler: Queued update for resource ${updatedResource.id}.`);
      } else {
        console.log(`Pushed Handler: Resource ${resource.id} did not meet update criteria.`);
      }
    }

    await Promise.all(putOperations);
    await tx.done;

    console.log(`Pushed Handler: Successfully updated ${updatedResourceIds.length} resources for changeId: ${changeId}. Updated IDs:`, updatedResourceIds);
  } catch (error) {
    console.error(`Pushed Handler: An error occurred during the update process:`, error);
    throw error;
  }
}


