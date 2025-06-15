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

      // Create a new object store with paymentId as the key path
      const store = db.createObjectStore('paymentPlans', { keyPath: 'paymentId' });

      // Create indexes for other fields you might want to query by
      store.createIndex('paymentPlanId', 'paymentPlanId', { unique: false });
      store.createIndex('decisionId', 'decisionId', { unique: false });
      store.createIndex('timestamp', 'timestamp', { unique: false });
    };
  });
};


export const getLatestPaymentPlan = async () => {
  let db;
  try {
    console.log('Attempting to open the payment plan database...');
    db = await openPaymentPlanDB();
    console.log('Database opened successfully.');
  } catch (error) {
    console.error('Failed to open database:', error);
    return null;
  }

  const tx = db.transaction("paymentPlans", "readonly");
  const store = tx.objectStore("paymentPlans");

  return new Promise((resolve) => {
    console.log('Attempting to retrieve the latest payment plan...');
    const request = store.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        console.log('Latest payment plan retrieved:', cursor.value);
        resolve(cursor.value);
      } else {
        console.log('No payment plans found in the database.');
        resolve(null);
      }
    };

    request.onerror = (event) => {
      console.error('Failed to retrieve latest payment plan:', event.target.error);
      resolve(null);
    };
  });
};


export const getAllPayments = async () => {
  let db;
  try {
    db = await openPaymentPlanDB();
  } catch (error) {
    console.error('Failed to open database:', error);
    return [];
  }

  const tx = db.transaction("paymentPlans", "readonly");
  const store = tx.objectStore("paymentPlans");

  return new Promise((resolve) => {
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Failed to retrieve all payments:', event.target.error);
      resolve([]);
    };
  });
};

export const setPaymentIdToProcessed = async (paymentId, status, timestamp) => {
  let db;
  try {
    db = await openPaymentPlanDB();
  } catch (error) {
    console.error('setPaymentIdToProcessed - Failed to open database:', error);
    return false;
  }

  console.log(`setPaymentIdToProcessed - Attempting to update payment with ID: ${paymentId}, status: ${status}, timestamp: ${timestamp}`);
  const tx = db.transaction("paymentPlans", "readwrite");
  const store = tx.objectStore("paymentPlans");

  return new Promise((resolve) => {
    const request = store.get(paymentId);
    console.log(`setPaymentIdToProcessed - Retrieving payment with ID: ${paymentId}`);

    request.onsuccess = (event) => {
      const payment = event.target.result;
      if (payment) {
        payment.status = status;
        payment.date = new Date(timestamp).toISOString();

        const updateRequest = store.put(payment);
        updateRequest.onsuccess = () => {
          console.log(`setPaymentIdToProcessed - Payment with ID ${paymentId} updated successfully.`);
          resolve(true);
        };
        updateRequest.onerror = (event) => {
          console.error(`setPaymentIdToProcessed . Failed to update payment with ID ${paymentId}:`, event.target.error);
          resolve(false);
        };
      } else {
        console.log(`setPaymentIdToProcessed - No payment found with ID ${paymentId}.`);
        resolve(false);
      }
    };

    request.onerror = (event) => {
      console.error(`setPaymentIdToProcessed - Failed to retrieve payment with ID ${paymentId}:`, event.target.error);
      resolve(false);
    };
  });
};

export const clearPaymentPlansDB = async () => {
  let db;
  try {
    db = await openPaymentPlanDB();
  } catch (error) {
    console.error('Failed to open database:', error);
    return false;
  }

  return new Promise((resolve) => {
    const tx = db.transaction("paymentPlans", "readwrite");
    const store = tx.objectStore("paymentPlans");

    const request = store.clear();

    request.onsuccess = () => {
      console.log('All records cleared successfully.');
      resolve(true);
    };

    request.onerror = (event) => {
      console.error('Failed to clear records:', event.target.error);
      resolve(false);
    };

    tx.oncomplete = () => {
      db.close();
    };
  });
};

export const fetchLatestPayments = async () => {
  let db;
  try {
    db = await openPaymentPlanDB();
  } catch (error) {
    console.error('Failed to open database:', error);
    return { latestPaymentPlanId: null, payments: [] };
  }

  return new Promise((resolve) => {
    const tx = db.transaction("paymentPlans", "readonly");
    const store = tx.objectStore("paymentPlans");

    const request = store.getAll();

    request.onsuccess = (event) => {
      const allPayments = event.target.result;

      // Log all payments to verify the structure and field names
      console.log('All payments fetched:', allPayments);

      // Filter payments based on status
      const filteredPayments = allPayments.filter(payment =>
        payment.status === 'PaymentProcessed'
       );

      if (filteredPayments.length === 0) {
        console.log('No payments found with the specified statuses.');
        resolve({ latestPaymentPlanId: null, payments: [] });
        return;
      }

      // Log filtered payments to verify the status field
      console.log('Filtered payments:', filteredPayments);

      // Sort payments by timestamp in descending order to find the latest
      const sortedPayments = [...filteredPayments].sort((a, b) => b.timestamp - a.timestamp);
      const latestPaymentPlanId = sortedPayments[0].paymentPlanId;

      console.log('Fetched filtered payments with latest paymentPlanId:', {
        latestPaymentPlanId,
        payments: filteredPayments
      });

      resolve({
        latestPaymentPlanId,
        payments: filteredPayments
      });
    };

    request.onerror = (event) => {
      console.error('Failed to retrieve payments:', event.target.error);
      resolve({ latestPaymentPlanId: null, payments: [] });
    };
  });
};

