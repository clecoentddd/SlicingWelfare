// src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { StoredEvent } from "../slices/shared/genericTypes";
import { createChangeHandler } from "../slices/01_createChange/createChangeHandler";
import { addIncomeCommand, addExpenseCommand } from "../slices/02_commitChanges/addIncomesAndExpenses";
import { handlePushCommand } from "../slices/04_PushChange/handlePushCommand";
import { handleCommitChanges } from "../slices/02_commitChanges/handleCommitChanges";
import { openEventDB } from "../slices/shared/openEventDB";
import { startProjectionListener } from "../slices/03_viewResources/projectionHandler";
import { startPushedProjectionListener } from "../slices/05_updateChangesToPushed/projectionHandler";
import styles from "./page.module.css";
import ProjectionPanel from "../slices/03_viewResources/projectionPanel";
import { getChangeStatus } from "../slices/shared/getStatus";

async function fetchEvents(): Promise<StoredEvent[]> {
  const db = await openEventDB();
  return await db.getAll("events");
}




export default function Page() {
  const [dbEvents, setDbEvents] = useState<StoredEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<StoredEvent[]>([]);
  const [changeId, setChangeId] = useState<string | null>(null);

  const loadEvents = async () => {
    const events = await fetchEvents();
    setDbEvents(events);

    const latestChangeEvent = events.reverse().find(e => e.type === "ChangeCreated");
    if (latestChangeEvent) {
      setChangeId(latestChangeEvent.payload.changeId);
    }
  };

  const latestChangeStatus = useMemo(() => {
    return getChangeStatus(dbEvents, changeId);
  }, [dbEvents, changeId]);

  const handleCreateChange = async () => {
    setError(null);
    try {
      const { changeId: newChangeId } = await createChangeHandler();
      setChangeId(newChangeId);
      await loadEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddIncome = async () => {
    if (!changeId) return;
    const event = await addIncomeCommand(changeId);
    if (event) setPending((prev) => [...prev, event]);
  };

  const handleAddExpense = async () => {
    if (!changeId) return;
    const event = await addExpenseCommand(changeId);
    if (event) setPending((prev) => [...prev, event]);
  };

  const handleCommit = async () => {
    try {
      await handleCommitChanges(pending, changeId);
      await loadEvents();
      setPending([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePush = async () => {
    if (!changeId) {
      setError("No change ID available to push changes.");
      return;
    }
    try {
      await handlePushCommand(changeId);
      await loadEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadEvents();
    startProjectionListener();
    startPushedProjectionListener();
  }, []);

  return (
    <main className={styles.container}>
      <section className={styles.leftColumn}>
        <h1 className={styles.heading}>Event Sourcing Demo</h1>
        <h2>Change ID: {changeId ?? "None"}</h2>
        <p className={styles.statusText}>Status: {latestChangeStatus}</p>

        <button className={styles.btnCreate} onClick={handleCreateChange}>Create Change</button>
        <button className={styles.btnIncome} onClick={handleAddIncome}>+ Income</button>
        <button className={styles.btnExpense} onClick={handleAddExpense}>+ Expense</button>
        <button className={styles.btnCommit} onClick={handleCommit} disabled={pending.length === 0}>Commit</button>
        <button className={styles.btnPush} onClick={handlePush}>Push Changes</button>

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
        {dbEvents.length === 0 ? (
          <p>No events to display.</p>
        ) : (
          dbEvents.map((ev, idx) => (
            <pre key={idx} className={styles.eventItem}>
              {JSON.stringify(ev, null, 2)}
            </pre>
          ))
        )}
      </section>

      <section className={styles.rightColumn}>
        <h1>Projection View</h1>
        <ProjectionPanel />
      </section>
    </main>
  );
}
