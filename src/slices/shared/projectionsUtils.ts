// src/utils/sharedProjectionUtils.ts

import { openResourceDB } from "./openResourceDB";
import type { StoredEvent } from "@/slices/shared/genericTypes";
import { IDBPDatabase } from 'idb';

export async function updateResourceStatus(changeId: string, newStatus: string) {
  try {
    const resourceDB: IDBPDatabase<unknown> = await openResourceDB();
    const resourceTx = resourceDB.transaction("resources", "readwrite");
    const resourceStore = resourceTx.objectStore("resources");

    // Ensure the index exists before trying to use it
    if (!resourceStore.indexNames.contains('byChangeId')) {
      throw new Error("Index 'byChangeId' does not exist.");
    }

    // Use the existing index "byChangeId" to get all resources with the given changeId
    const index = resourceStore.index('byChangeId');
    const resources = await index.getAll(IDBKeyRange.only(changeId));

    // Update the status of each resource
    for (const resource of resources) {
      if (resource.status === "Committed") {
        const updatedResource = { ...resource, status: newStatus };
        await resourceStore.put(updatedResource);
      }
    }

    await resourceTx.done;

    console.log(`✅ Updated status to ${newStatus} for resources with changeId: ${changeId}`);
  } catch (err) {
    console.error(`🔥 Error updating resource status for changeId ${changeId}:`, err);
    throw err;
  }
}
