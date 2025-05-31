"use client";

import { useEffect, useMemo, useState } from "react";
import { useDB, DBEvents } from "../slices/shared/DBEvents";
import { StoredEvent } from "../slices/shared/genericTypes";
import { createChangeHandler } from "../slices/createChange/createChangeHandler";
import { addIncomeCommand, addExpenseCommand } from "../slices/commitChanges/addIncomesAndExpenses";
import { openEventDB } from "../utils/openEventDB";
import { startProjectionListener } from "../slices/viewResources/projectionHandler";
import styles  from "./page.module.css";
import ProjectionPanel from "../slices/viewResources/projectionPanel";

// then inside return

export default function Page() {
  const dbEvents = useDB<StoredEvent>(DBEvents);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<StoredEvent[]>([]);

  const latestChange = useMemo(() => {
    return [...dbEvents].reverse().find(e => e.type === "ChangeCreated")?.payload ?? null;
  }, [dbEvents]);

  const handleCreateChange = async () => {
    setError(null);
    try {
      const changeId = "0x" + Math.floor(Math.random() * 10000).toString(16);
      await createChangeHandler(changeId, dbEvents);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddIncome = async () => {
    if (!latestChange?.changeId) return;
    const event = await addIncomeCommand(latestChange.changeId);
    if (event) setPending((prev) => [...prev, event]);
  };

  const handleAddExpense = async () => {
    if (!latestChange?.changeId) return;
    const event = await addExpenseCommand(latestChange.changeId);
    if (event) setPending((prev) => [...prev, event]);
  };

  const handleCommit = async () => {
    if (pending.length === 0) return;

    const db = await openEventDB();
    const tx = db.transaction("events", "readwrite");
    const store = tx.objectStore("events");

    for (const ev of pending) {
      await store.add(ev);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    });

    DBEvents.append(pending);
    setPending([]);
  };

  useEffect(() => {
    async function loadEvents() {
      const db = await openEventDB();
      const stored = await db.getAll("events");
      DBEvents.append(stored);
    }
    loadEvents();
    startProjectionListener(); // 🔁 Start projection listener
  }, []);

  return (
    <main className={styles.container}>
      <section className={styles.leftColumn}>
        <h1 className={styles.heading}>Event Sourcing Demo</h1>
        <h2>Change ID: {latestChange?.changeId ?? "None"}</h2>
        <p className={styles.statusText}>Status: {latestChange?.status ?? "None"}</p>

        <button className={styles.btnCreate} onClick={handleCreateChange}>Create Change</button>
        <button className={styles.btnIncome} onClick={handleAddIncome}>+ Income</button>
        <button className={styles.btnExpense} onClick={handleAddExpense}>+ Expense</button>
        <button className={styles.btnCommit} onClick={handleCommit} disabled={pending.length === 0}>Commit</button>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.pendingSection}>
          <h3 className={styles.pendingTitle}>Pending Events</h3>
          {pending.length === 0 ? (
            <p className={styles.noPending}>No pending events.</p>
          ) : (
            <ul className={styles.pendingList}>
              {pending.map((ev, i) => {
                if (ev.type !== "IncomeAdded" && ev.type !== "ExpenseAdded") return null;
                return (
                  <li className={styles.pendingItem} key={i}>
                    <strong>{ev.payload.description}</strong> — CHF {ev.payload.amount}
                    <span>
                      {ev.payload.period.start.toString().slice(0, 10)} → {ev.payload.period.end.toString().slice(0, 10)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <h3 className={styles.eventsTitle}>All Events</h3>
        {[...dbEvents].reverse().map((ev, idx) => (
          <pre key={idx} className={styles.eventItem}>
            {JSON.stringify(ev, null, 2)}
          </pre>
        ))}
      </section>

      <section className={styles.rightColumn}>
        <h1>Projection View</h1>
        <section className={styles.rightColumn}>
          <ProjectionPanel />
        </section>

      </section>
    </main>
  );
}
