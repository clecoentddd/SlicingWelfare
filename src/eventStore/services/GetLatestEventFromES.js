// src/eventStore/eventRepository.js

import { getEventDB } from '../eventDb.js';
import { EVENT_STORE_NAME } from '../eventDbConstants.js';

// Function to get the latest event of a specific type
export async function getLatestEventFromES(eventType) {
  try {
    const db = await getEventDB();
    const tx = db.transaction(EVENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(EVENT_STORE_NAME);

    // Retrieve all events from the store
    const allEvents = await store.getAll();
    await tx.done;

    // Filter events by specified type
    const filteredEvents = allEvents.filter(event => event.type === eventType);

    if (filteredEvents.length === 0) {
      console.log(`No events found of type ${eventType}.`);
      return null;
    }

    // Find the latest event based on the timestamp
    const latestEvent = filteredEvents.reduce((prev, current) => {
      return (prev.timestamp > current.timestamp) ? prev : current;
    });

    console.log(`Latest ${eventType} event found:`, latestEvent);
    return latestEvent;
  } catch (error) {
    console.error(`Error fetching the latest event of type ${eventType}:`, error);
    return null;
  }
}
