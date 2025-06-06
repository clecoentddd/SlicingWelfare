let dbInstance = null;

export const openPaymentPlanDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open('PaymentPlanDB', 1);

    request.onerror = (event) => {
      console.error('Error opening PaymentPlanDB:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('paymentPlans')) {
        const store = db.createObjectStore('paymentPlans', { keyPath: 'paymentId' });
        store.createIndex('previousPaymentId', 'previousPaymentId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};
