// src/slices/shared/sharedProjections.ts
import { openEventDB } from './openEventDB'; // Adjust path if necessary
import type { StoredEvent, EventWithId } from './genericTypes'; // Import EventWithId

const EVENT_STORE_NAME = "events";

export async function fetchEvents(): Promise<EventWithId[]> { // FIX: Return type is EventWithId[]
  const eventDB = await openEventDB();
  const tx = eventDB.transaction(EVENT_STORE_NAME, 'readonly');
  const store = tx.objectStore(EVENT_STORE_NAME);

  // Retrieve all events
  const events = await store.getAll();

  // You might want to filter or mark these events as processed after fetching
  // For now, return all events
  return events; // Assuming the 'id' property is automatically added by IndexedDB to fetched objects
}

// Helper to check if an event has an ID (i.e., it's an EventWithId)
export function hasId(event: StoredEvent | EventWithId): event is EventWithId {
  return typeof (event as EventWithId).id === 'number';
}