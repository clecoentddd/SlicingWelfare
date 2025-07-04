// src/eventStore/eventRepository.js

import { getEventDB } from './eventDb.js';
import { EVENT_STORE_NAME } from './eventDbConstants.js';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

/**
 * Appends a single event to the EventDB.
 * This is the primary function for writing new events to the store.
 * It automatically assigns a UUID (eventId) and relies on IndexedDB's autoIncrement
 * for the local database 'id'.
 *
 * @param {Object} event The event object to store. This object should contain
 * at least `type` and `payload` properties.
 * @returns {Promise<Object>} A promise that resolves with the stored event object,
 * now including its generated IndexedDB 'id' and 'eventId'.
 */

export async function appendEvent(event) {
  const db = await getEventDB();
  const tx = db.transaction(EVENT_STORE_NAME, "readwrite");
  const store = tx.objectStore(EVENT_STORE_NAME);

  const eventToStore = {
    ...event, // Spread all existing properties from the input 'event'
    eventId: event.eventId || uuidv4(), // Assign a UUID for global uniqueness if not present
    timestamp: event.timestamp || Date.now(), // Ensure timestamp is present if not present
  };

  console.log(`[EventDB DEBUG] Appending event: ${JSON.stringify(eventToStore, null, 2)}`); // Use JSON.stringify for better logging
  const generatedId = await store.add(eventToStore); // Add event to store, gets IndexedDB's local 'id'
  const storedEventWithLocalId = { ...eventToStore, id: generatedId }; // Combine for return

  await tx.done; // Wait for the transaction to complete
  console.log(`[EventDB DEBUG] Event appended with local ID: ${generatedId}, UUID: ${storedEventWithLocalId.eventId}`);
  return storedEventWithLocalId;
}

/**
 * Retrieves all events associated with a specific changeId from the EventDB.
 * Requires an index 'byChangeId' on the 'events' object store.
 *
 * @param {string} changeId The changeId to query events for.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of event objects.
 */
export async function getEventsByChangeId(changeId) {
    console.log(`[EventDB DEBUG] getEventsByChangeId called for changeId: ${changeId}`);

    const db = await getEventDB();

    const tx = db.transaction(EVENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(EVENT_STORE_NAME);
    
    if (!store.indexNames.contains('byChangeId')) {
        console.error(`[EventDB ERROR] Index 'byChangeId' not found on store '${EVENT_STORE_NAME}'. Please ensure your database schema is up-to-date.`);
        throw new Error(`IndexedDB index 'byChangeId' not found.`);
    }

    const index = store.index('byChangeId'); 

    const events = await index.getAll(changeId);
    await tx.done;
    console.log(`[EventDB DEBUG] Found ${events.length} events for changeId: ${changeId}.`);
    return events;
}

/**
 * Fetches all events from the EventDB.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of all event objects.
 */
export async function getAllEvents() {
  const db = await getEventDB();
  const tx = db.transaction(EVENT_STORE_NAME, 'readonly');
  const store = tx.objectStore(EVENT_STORE_NAME);

  const events = await store.getAll();
  await tx.done;
  console.log(`[EventDB DEBUG] Fetched ${events.length} total events.`);
  return events;
}

/**
 * Helper to check if an event object has an IndexedDB 'id'.
 * @param {Object} event The event object to check.
 * @returns {boolean} True if the event has an 'id' property that is a number.
 */
export function hasId(event) {
  return typeof event.id === 'number';
}

// Function to retrieve an event by calculationId
// Function to retrieve an event by calculationId
export async function getCalculationById(calculationId) {
  console.log(`Starting to retrieve calculation with ID: ${calculationId}`);

  // Retrieve all events using the existing getAllEvents function
  const events = await getAllEvents();

  console.log(`Filtering events to find CalculationPerformed with calculationId: ${calculationId}`);

  // Filter events to find the CalculationPerformed event with the matching calculationId
  const calculationEvent = events.find(event =>
    event.type === "CalculationPerformed" &&
    event.calculationId === calculationId
  );

  if (calculationEvent) {
    console.log('Calculation event found:', calculationEvent);
  } else {
    console.log('No calculation event found with the given calculationId.');
  }

  return calculationEvent;
}