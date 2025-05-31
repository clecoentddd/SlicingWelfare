// src/slices/shared/openEventDB.ts
import { openDB } from 'idb';

export async function openEventDB() {
  // Ensure that this code only runs in the browser
  if (typeof window === 'undefined') {
    throw new Error('indexedDB is not available on the server side.');
  }

  return openDB('EventDB', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}
