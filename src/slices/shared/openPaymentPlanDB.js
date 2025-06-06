const DB_NAME = 'PaymentPlanDB';
const DB_VERSION = 2; // You can change this version number as needed


export const openPaymentPlanDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error(`Error opening ${DB_NAME}:`, event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Delete the existing object store if it exists
      if (db.objectStoreNames.contains('paymentPlans')) {
        db.deleteObjectStore('paymentPlans');
      }

      // Create a new object store with the desired schema
      const store = db.createObjectStore('paymentPlans', { keyPath: 'paymentPlanId' });
      store.createIndex('decisionId', 'decisionId', { unique: false });
      store.createIndex('timestamp', 'timestamp', { unique: false });
    };
  });
};


export const getLatestPaymentPlan = async () => {
  let db;
  try {
    db = await openPaymentPlanDB();
  } catch (error) {
    console.error('Failed to open database:', error);
    return null;
  }

  const tx = db.transaction("paymentPlans", "readonly");
  const store = tx.objectStore("paymentPlans");

  return new Promise((resolve) => {
    const request = store.openCursor(null, 'prev');
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        resolve(cursor.value);
      } else {
        resolve(null);
      }
    };
    request.onerror = (event) => {
      console.error('Failed to retrieve latest payment plan:', event.target.error);
      resolve(null);
    };
  });
};
