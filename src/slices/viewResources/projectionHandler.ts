// src/slices/viewResources/projectionHandler.ts
import { DBEvents } from "@/slices/shared/DBEvents";
import { openResourceDB } from "./openResourceDB";
import type { StoredEvent } from "@/slices/shared/genericTypes";

export async function startProjectionListener() {
  DBEvents.subscribe(async () => {
    try {
      const events = DBEvents.list();
      const resourceDB = await openResourceDB();
      const tx = resourceDB.transaction("resources", "readwrite");
      const store = tx.objectStore("resources");

      for (const ev of events) {
        if (ev.type === "IncomeAdded" || ev.type === "ExpenseAdded") {
          const { changeId, description, amount, period } = ev.payload;
          const status = "Committed"; // default for now

          const start = new Date(period.start);
          const end = new Date(period.end);
          const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
          const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

          while (current <= last) {
            const month = `${(current.getUTCMonth() + 1).toString().padStart(2, '0')}-${current.getUTCFullYear()}`;

            store.put({
              month,
              type: ev.type === "IncomeAdded" ? "Income" : "Expense",
              description,
              amount,
              changeId,
              status,
              timestamp: ev.timestamp
            });
            current.setUTCMonth(current.getUTCMonth() + 1);
          }
        }
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      
      console.log("✅ Projection committed to resources store");
    } catch (err) {
      console.error("🔥 Error in startProjectionListener:", err);
    }
  });
}
