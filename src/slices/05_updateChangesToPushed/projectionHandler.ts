import { openResourceDB } from "../shared/openResourceDB";
import { openEventDB } from "../shared/openEventDB";
import type { StoredEvent } from "@/slices/shared/genericTypes";

let lastProcessedTimestamp = 0; // Initialize with a default value

async function processPushedEvents() {
  try {
    console.log("Starting processPushedEvents...");
    const eventDB = await openEventDB();
    const eventTx = eventDB.transaction("events", "readonly");
    const eventStore = eventTx.objectStore("events");
    const events = await eventStore.getAll();

    console.log(`Fetched ${events.length} events.`);

    // Filter events that are newer than the last processed timestamp
    const newEvents = events.filter(event => event.timestamp > lastProcessedTimestamp);
    console.log(`Found ${newEvents.length} new events to process.`);

    if (newEvents.length > 0) {
      const resourceDB = await openResourceDB();
      const resourceTx = resourceDB.transaction("resources", "readwrite");
      const resourceStore = resourceTx.objectStore("resources");

      for (const ev of newEvents) {
        if (ev.type === "ChangePushed") {
          console.log(`Processing ChangePushed event with ID: ${ev.id} and timestamp: ${ev.timestamp}`);
          const { changeId } = ev.payload;
          const index = resourceStore.index("byChangeId");
          const resources = await index.getAll(IDBKeyRange.only(changeId));

          console.log(`Found ${resources.length} resources for changeId: ${changeId}`);

          for (const resource of resources) {
            const resourceIdPart = resource.id.split('-')[0]; // Extract the part before the first hyphen
            console.log(`Checking resource with ID part: ${resourceIdPart}, full ID: ${resource.id}, status: ${resource.status}, and timestamp: ${resource.timestamp} against ChangePushed event ID: ${ev.id}`);
            if (resource.status === "Committed" && parseInt(resourceIdPart) < ev.id && resource.timestamp < ev.timestamp) {
              console.log(`Updating resource with full ID: ${resource.id} to status: Pushed`);
              const updatedResource = { ...resource, status: "Pushed" };
              await resourceStore.put(updatedResource);
            } else {
              console.log(`Skipping resource with full ID: ${resource.id} as it does not meet the update criteria for ChangePushed event ID: ${ev.id}.`);
            }
          }
        }
      }

      // Update the last processed timestamp to the newest event's timestamp
      lastProcessedTimestamp = Math.max(...newEvents.map(event => event.timestamp));
      console.log(`Updated lastProcessedTimestamp to: ${lastProcessedTimestamp}`);

      await resourceTx.done;
      console.log("✅ Projection of pushed status committed to resources store");
    } else {
      console.log("No new events to process.");
    }
  } catch (err) {
    console.error("🔥 Error in processPushedEvents:", err);
  }
}

export async function startPushedProjectionListener() {
  console.log("Starting Pushed Projection Listener...");
  await processPushedEvents();
  setInterval(async () => {
    console.log("Polling for new events...");
    await processPushedEvents();
  }, 5000); // Poll every 5 seconds
}
