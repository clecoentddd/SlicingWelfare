// src/app/decision-projection/page.jsx

'use client';

import { useEffect, useState } from 'react';
import { projectDecisionEvents } from "../../slices/10_DecisionProjection/DecisionProjection";
import { openDecisionDB, getAllFromStore } from "../../slices/shared/openDecisionDB";
import Navbar from '../../../components/Navbar';
import styles from './globalView..module.css';

export default function DecisionProjectionPage() {
  const [decisions, setDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const rebuildProjection = async () => {
    setIsLoading(true);
    try {
      await projectDecisionEvents();
      const decisionDb = await openDecisionDB();
      const decisionTx = decisionDb.transaction("decisions", "readonly");
      const decisionStore = decisionTx.objectStore("decisions");
      const result = await getAllFromStore(decisionStore);
      setDecisions(result);
    } catch (err) {
      console.error("Failed to rebuild projection:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        await projectDecisionEvents();
        const decisionDb = await openDecisionDB();
        const decisionTx = decisionDb.transaction("decisions", "readonly");
        const decisionStore = decisionTx.objectStore("decisions");
        const result = await getAllFromStore(decisionStore);
        setDecisions(result);
      } catch (err) {
        console.error("Failed to fetch decisions:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <Navbar />
      <main className={styles.container}>
        <h1 className={styles.title}>Decision Projection View</h1>
        <button onClick={rebuildProjection} className={styles.rebuildButton} disabled={isLoading}>
          {isLoading ? 'Rebuilding...' : 'Rebuild Projection'}
        </button>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Change ID</th>
                  <th>Calculation ID</th>
                  <th>Decision Taken</th>
                  <th>Decision ID</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((decision) => (
                  <tr key={decision.id}>
                    <td>{decision.changeId}</td>
                    <td>{decision.calculationId || 'N/A'}</td>
                    <td>{decision.decisionTaken ? 'Yes' : 'No'}</td>
                    <td>{decision.decisionId || 'N/A'}</td>
                    <td>{decision.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
