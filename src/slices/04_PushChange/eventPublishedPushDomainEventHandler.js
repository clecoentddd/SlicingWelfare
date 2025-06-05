"use client";

import { getEventDB } from "../../eventStore/eventDb";
import { EVENT_STORE_NAME } from "../../eventStore/eventDbConstants";
import { eventEmitter } from '../shared/eventEmitter';

/**
 * Publishes a DataPushed domain event.
 * @param {Object} event The ChangePushed event object from the event stream.
 */
export async function publishPushedDomainEvent(event) {
  const db = await getEventDB();

  // Create the DataPushed domain event based on the ChangePushed event
  const dataPushedEvent = {
    type: "DataPushed",
    timestamp: Date.now(),
    payload: {
      changeId: event.payload.changeId,
      eventId: event.id // Use the id from the ChangePushed event
    },
    metadata: {
      domainEvent: true // Add metadata to indicate this is a domain event
    }
  };

  // Store the DataPushed event in the EventDB
  const tx = db.transaction(EVENT_STORE_NAME, "readwrite");
  const store = tx.objectStore(EVENT_STORE_NAME);
  await store.add(dataPushedEvent);
  await tx.done;

  // Emit the DataPushed domain event
  eventEmitter.emit('DataPushed', dataPushedEvent);

  console.log(`Published DataPushed domain event for changeId: ${event.payload.changeId}`);
}
