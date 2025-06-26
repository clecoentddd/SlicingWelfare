// src/app/page.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getAllEvents } from "../eventStore/eventRepository.js";
import { createChangeHandler } from "../slices/01_createChange/createChangeHandler.js";
import { addIncomeCommand, addExpenseCommand } from "../slices/02_commitChanges/addIncomesAndExpensesUI.js";
import { pushChangeHandler } from "../slices/04_PushChange/pushChangeHandler.js";
import { handleCommitCommand } from "../slices/02_commitChanges/commitChangeHandler.js";
import styles from "./page.module.css";
import ProjectionPanel from "../slices/03_viewResources/projectionPanel.jsx";
import { getChangeStatus } from "../slices/shared/getStatus.js";
import { handleEventForProjection } from '../slices/03_viewResources/handleCommittedEventForProjection.js';
import Navbar from '../../components/Navbar';
import { cancelChangeHandler } from "../slices/22_CancelChange/cancelChangeHandler.js";

async function fetchAllEventsForDisplay() {
  const events = await getAllEvents();
  return events;
}

export default function Page() {
  const [dbEvents, setDbEvents] = useState([]);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState([]);
  const [changeId, setChangeId] = useState(null);

const loadEventsForDisplay = useCallback(async () => {
  try {
    const events = await fetchAllEventsForDisplay();
    setDbEvents(events);

    // Scan from newest to oldest
    let activeChangeId = null;

    for (const e of events.slice().reverse()) {
      if (e.type === "ChangePushed" || e.type === "ChangeCanceled") {
        // This change is no longer active, stop tracking it
        break;
      }
      if (e.type === "ChangeCreated") {
        activeChangeId = e.changeId;
        break;
      }
    }

    setChangeId(activeChangeId);
  } catch (err) {
    console.error("Error loading events for display:", err);
    setError("Failed to load events for display: " + err.message);
  }
}, []);


  useEffect(() => {
    loadEventsForDisplay();

  }, [loadEventsForDisplay]);

  const latestChangeStatus = useMemo(() => {
    return getChangeStatus(dbEvents, changeId);
  }, [dbEvents, changeId]);

  const refreshAfterAction = async () => {
  console.log ("refreshAfterAction Calling");
  await loadEventsForDisplay();
  setPending([]); // Always clear pending, as the state is no longer valid after push/cancel
  console.log ("refreshAfterAction Done");
};

  const handleCreateChange = async () => {
    setError(null); // Clear any previous errors
    try {
      console.log("Calling createChangeHandler from page.jsx...");

      // Call the handler. It will return null if a business rule was violated
      // (and would have already displayed an alert).
      const storedChangeEvent = await createChangeHandler();

      // *** START OF FIX ***
      // Check if a change event was actually stored before proceeding.
      if (storedChangeEvent) {
        // If storedChangeEvent is not null, it means the creation was successful.
        setChangeId(storedChangeEvent.changeId); // Safely update changeId state
        await handleEventForProjection(storedChangeEvent); // Safely process event for projection
        await loadEventsForDisplay(); // Reload all events to update the UI
      } else {
        // If storedChangeEvent is null, it means the creation was aborted by a business rule.
        // The alert message was already displayed by createChange (via createChangeHandler),
        // so no need to set a local error state or show another alert here.
        console.log("Change creation was aborted due to a business rule; alert already displayed.");
      }
      // *** END OF FIX ***

    } catch (err) {
      // This catch block is for unexpected technical errors that might occur
      // during the execution of handleCreateChange (e.g., network issues,
      // unhandled errors in called functions that are not business rule violations).
      console.error("Unexpected error in handleCreateChange:", err);
      setError(err.stack || err.message || JSON.stringify(err));
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
      await handleCommitCommand(pending, changeId);
      await refreshAfterAction();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePush = async () => {
    if (!changeId) {
      setError("No change ID available to push changes.");
      return;
    }
    try {
      await pushChangeHandler(changeId);
      await refreshAfterAction();
    } catch (error) {
      setError(error.message);
    }
  };

    const handleCancel = async () => {
    if (!changeId) {
      setError("No change ID available to push changes.");
      return;
    }
    try {
      await cancelChangeHandler(changeId);
      await refreshAfterAction();
    } catch (error) {
      setError(error.message);
    }
  };


  return (
    <div>
      <Navbar />
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
          <button className={styles.btnCancelChange} onClick={handleCancel}>Cancel Changes</button>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.pendingSection}>
            <h3 className={styles.pendingTitle}>Pending Events</h3>
            {pending.length === 0 ? (
              <p>No pending events.</p>
            ) : (
              <ul className={styles.pendingList}>
                {pending.map((ev, i) => {
                  if (ev.type !== "IncomeAdded" && ev.type !== "ExpenseAdded") return null;
                  return (
                    <li className={styles.pendingItem} key={i}>
                      <strong>{ev.payload.description}</strong> — CHF {ev.payload.amount}
                      <span>
                        {ev.payload.period.start?.toString().slice(0, 10)} → {ev.payload.period.end?.toString().slice(0, 10)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <h3 className={styles.eventsTitle}>All Events (from EventDB)</h3>
          {dbEvents.length === 0 ? (
            <p>No events to display.</p>
          ) : (
            dbEvents.slice().reverse().map((ev, idx) => (
              <pre key={idx} className={styles.eventItem}>
                {JSON.stringify(ev, null, 2)}
              </pre>
            ))
          )}
        </section>

        <section className={styles.rightColumn}>
          <h1>Resources</h1>
          <ProjectionPanel />
        </section>
      </main>
    </div>
  );
}