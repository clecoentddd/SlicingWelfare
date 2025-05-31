import { openDB } from "idb";

export async function openEventDB() {
  return openDB("EventDB", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("events")) {
        db.createObjectStore("events", { keyPath: "id", autoIncrement: true });
      }
    },
  });
}
