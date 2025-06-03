// src/app/page.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getEventDB } from "../eventStore/eventDb.js";
import { EVENT_STORE_NAME } from "../eventStore/eventDbConstants.js";
import { getAllEvents } from "../eventStore/eventRepository.js";
import { createChangeHandler } from "../slices/01_createChange/createChangeHandler.js";
import { addIncomeCommand, addExpenseCommand } from "../slices/02_commitChanges/addIncomesAndExpensesUI.js";
import { handlePushCommand } from "../slices/04_PushChange/handlePushCommand.js";
import { handleCommitCommand } from "../slices/02_commitChanges/handleCommitCommand.js";
import styles from "./page.module.css";
import ProjectionPanel from "../slices/03_viewResources/projectionPanel.jsx";
import { getChangeStatus } from "../slices/shared/getStatus.js";
import { handleEventForProjection } from '../slices/03_viewResources/handleEventForProjection.js';
import '../slices/06_CalculationProcessor/calculationProcessor.js';
import Navbar from '../../components/Navbar';

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

      const latestChangeEvent = events.slice().reverse().find(e => e.type === "ChangeCreated");
      if (latestChangeEvent) {
        setChangeId(latestChangeEvent.payload.changeId);
      } else {
        setChangeId(null);
      }
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

  const handleCreateChange = async () => {
    setError(null);
    try {
      console.log("Calling createChangeHandler from page.jsx...");

      const storedChangeEvent = await createChangeHandler();
      setChangeId(storedChangeEvent.payload.changeId);

      await handleEventForProjection(storedChangeEvent);
      await loadEventsForDisplay();
    } catch (err) {
      console.error("Error in handleCreateChange:", err);
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
      await loadEventsForDisplay();
      setPending([]);
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
      await handlePushCommand(changeId);
      await loadEventsForDisplay();
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
          <h1>Projection View</h1>
          <ProjectionPanel />
        </section>
      </main>
    </div>
  );
}
