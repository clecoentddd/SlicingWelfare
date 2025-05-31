// src/utils/eventDB.ts
import { openDB } from 'idb';
import { StoredEvent } from './genericTypes';

export async function appendEvent(eventOrEvents: StoredEvent | StoredEvent[]) {
  const db = await openDB('EventDB', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  const tx = db.transaction('events', 'readwrite');
  const store = tx.objectStore('events');

  if (Array.isArray(eventOrEvents)) {
    for (const event of eventOrEvents) {
      await store.add(event);
    }
  } else {
    await store.add(eventOrEvents);
  }

  await tx.done;
}

export async function listEvents(): Promise<StoredEvent[]> {
  const db = await openDB('EventDB', 2);
  return db.getAll('events');
}

export async function clearEvents() {
  const db = await openDB('EventDB', 2);
  const tx = db.transaction('events', 'readwrite');
  const store = tx.objectStore('events');
  await store.clear();
  await tx.done;
}
