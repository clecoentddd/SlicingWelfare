// src/slices/pushChange/eventPushedPublishedHandler.js
"use client";

import { getEventDB } from "../../eventStore/eventDb"; 
import { EVENT_STORE_NAME } from "../../eventStore/eventDbConstants"; 
import { eventEmitter } from '../shared/eventEmitter'; 

/**
 * Publishes a Data Pushed event to the EventDB and emits it.
 * @param {string} changeId The ID of the change associated with the event.
 * @param {number} eventId The ID of the specific event being pushed/published.
 */
export async function publishPushedDomainEvent(changeId, eventId) {
  const db = await getEventDB();

  const ev = { 
    type: "DataPushed",
    timestamp: Date.now(),
    payload: { changeId , eventId}
  };

  const tx = db.transaction(EVENT_STORE_NAME, "readwrite");
  const store = tx.objectStore(EVENT_STORE_NAME);
  await store.add(ev);
  await tx.done;

  eventEmitter.emit('DataPushed', ev);

  console.log(`Published DataPushed event for changeId: ${changeId}`);
}