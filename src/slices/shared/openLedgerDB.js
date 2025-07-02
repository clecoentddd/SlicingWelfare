const DB_NAME = "ledgerDB";
const STORE_NAME = "ledger";
const DB_VERSION = 1;

export function openLedgerDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addLedgerEntry(entry) {
  const db = await openLedgerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllLedgerEntries() {
  const db = await openLedgerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeLedgerEntry(id) {
  const db = await openLedgerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearLedgerDB() {
  const db = await openLedgerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    console.log("[LedgerDB] Clearing all entries from store:", STORE_NAME);
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = async () => {
      // Check if DB is really empty
      const checkTx = db.transaction(STORE_NAME, "readonly");
      const checkStore = checkTx.objectStore(STORE_NAME);
      const getAllRequest = checkStore.getAll();
      getAllRequest.onsuccess = () => {
        console.log("[LedgerDB] Entries after clear:", getAllRequest.result);
        resolve(true);
      };
      getAllRequest.onerror = () => {
        console.error("[LedgerDB] Error checking entries after clear");
        resolve(false);
      };
    };
    tx.onerror = () => {
      console.error("[LedgerDB] Error clearing store:", tx.error);
      reject(false);
    };
      });
}