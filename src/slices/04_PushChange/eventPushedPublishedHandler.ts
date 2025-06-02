// src/slices/pushChange/eventPushedPublishedHandler.ts
import { openEventDB } from "../shared/openEventDB";
import { eventEmitter } from '../shared/eventEmitter';
import { PushedDomainEvent } from "../shared/domainEvents";

export async function publishDataPushedEvent(changeId: string) {
  const db = await openEventDB();
  const ev: PushedDomainEvent = {
    type: "DataPushed",
    timestamp: Date.now(),
    payload: { changeId }
  };

  const tx = db.transaction("events", "readwrite");
  const store = tx.objectStore("events");
  await store.add(ev);
  await tx.done;

    // Emit the event to notify subscribers
  eventEmitter.emit('DataPushed', ev);

  console.log(`Published DataPushed event for changeId: ${changeId}`);
}
