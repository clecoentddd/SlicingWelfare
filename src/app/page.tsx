// src/app/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react"; // Added useCallback
import { StoredEvent } from "../slices/shared/genericTypes";
import { createChangeHandler } from "../slices/01_createChange/createChangeHandler";
import { addIncomeCommand, addExpenseCommand } from "../slices/02_commitChanges/addIncomesAndExpenses";
import { handlePushCommand } from "../slices/04_PushChange/handlePushCommand";
import { handleCommitChanges } from "../slices/02_commitChanges/handleCommitChanges";
import { openEventDB } from "../slices/shared/openEventDB"; // Your event DB opener
import { startUnifiedProjectionListener, stopUnifiedProjectionListener } from "../slices/shared/projections/unifiedListener"; // Corrected import path for the listener
import styles from "./page.module.css";
import ProjectionPanel from "../slices/03_viewResources/projectionPanel";
import { getChangeStatus } from "../slices/shared/getStatus";
// Import the processorCalculation module to register the event listener
import '../slices/06_CalculationProcessor/calculationProcessor';

// This function fetches ALL events from EventDB for display in the UI.
// It's separate from the projection's internal event fetching.
async function fetchAllEventsForDisplay(): Promise<StoredEvent[]> {
  const db = await openEventDB();
  return await db.getAll("events"); // 'events' is the object store name
}

export default function Page() {
  const [dbEvents, setDbEvents] = useState<StoredEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<StoredEvent[]>([]);
  const [changeId, setChangeId] = useState<string | null>(null);

  // Use useCallback to memoize this function, preventing unnecessary re-renders
  // and ensuring stable dependencies for useEffect if used elsewhere.
  const loadEventsForDisplay = useCallback(async () => {
    try {
      const events = await fetchAllEventsForDisplay();
      setDbEvents(events);

      // Find the latest ChangeCreated event for setting changeId
      const latestChangeEvent = events.reverse().find(e => e.type === "ChangeCreated");
      if (latestChangeEvent) {
        setChangeId(latestChangeEvent.payload.changeId);
      } else {
        setChangeId(null); // No change created yet
      }
    } catch (err: any) {
      console.error("Error loading events for display:", err);
      setError("Failed to load events for display: " + err.message);
    }
  }, []); // Empty dependency array because it doesn't depend on component state/props

  const latestChangeStatus = useMemo(() => {
    return getChangeStatus(dbEvents, changeId);
  }, [dbEvents, changeId]);

  const handleCreateChange = async () => {
    setError(null);
    try {
      const { changeId: newChangeId } = await createChangeHandler();
      setChangeId(newChangeId);
      await loadEventsForDisplay(); // Reload events after creation
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddIncome = async () => {
    if (!changeId) {
      setError("Please create a change first.");
      return;
    }
    const event = await addIncomeCommand(changeId);
    if (event) setPending((prev) => [...prev, event]);
  };

  const handleAddExpense = async () => {
    if (!changeId) {
      setError("Please create a change first.");
      return;
    }
    const event = await addExpenseCommand(changeId);
    if (event) setPending((prev) => [...prev, event]);
  };

  const handleCommit = async () => {
    try {
      await handleCommitChanges(pending, changeId);
      await loadEventsForDisplay(); // Reload events after commit
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
      await loadEventsForDisplay(); // Reload events after push
    } catch (err: any) {
      setError(err.message);
    (error: any) => { // Catch error specifically for Push button
        setError(error.message);
    }
    }
  };

  useEffect(() => {
    console.log("page.tsx: Setting up unified projection listener and initial event display.");

    // 1. Start the unified projection listener
    startUnifiedProjectionListener();

    // 2. Load all events for immediate display in the UI
    loadEventsForDisplay();

    // 3. Set up an interval to periodically refresh the UI's event list
    // This catches events added by other means or ensures freshness.
    const displayRefreshIntervalId = setInterval(loadEventsForDisplay, 3000); // Refresh every 3 seconds

    // Cleanup function for when the component unmounts
    return () => {
      console.log("page.tsx: Cleaning up unified projection listener and display refresh interval.");
      stopUnifiedProjectionListener(); // Stop the projection listener
      clearInterval(displayRefreshIntervalId); // Clear the UI refresh interval
    };
  }, [loadEventsForDisplay]); // Dependency: loadEventsForDisplay to ensure it's stable

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

        <h3 className={styles.eventsTitle}>All Events (from EventDB)</h3> {/* Clarified title */}
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