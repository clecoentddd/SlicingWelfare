'use client';

import { useEffect, useState } from 'react';
import { getAllChangeIdStatuses as getResourceStatuses } from '../../slices/shared/openResourceDB';
import { getAllChangeIdStatuses as getCalculationStatuses } from '../../slices/shared/openCalculationDB';
import { getAllChangeIdStatuses as getDecisionStatuses } from '../../slices/shared/openDecisionDB';
import Navbar from '../../../components/Navbar';
import styles from './globalView.module.css';

const alignStatuses = (resourceStatuses, calculationStatuses, decisionStatuses) => {
  const allChangeIds = new Set([
    ...Object.keys(resourceStatuses),
    ...Object.keys(calculationStatuses),
    ...Object.keys(decisionStatuses),
  ]);

  return Array.from(allChangeIds).map(changeId => ({
    changeId,
    resourceStatus: resourceStatuses[changeId] || 'Not found',
    calculationStatus: calculationStatuses[changeId] || 'Not found',
    decisionStatus: decisionStatuses[changeId] || 'Not found',
  }));
};

const DataTable = ({ changes }) => (
  <div className={styles.tableContainer}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Change ID</th>
          <th>Resource Status</th>
          <th>Calculation Status</th>
          <th>Decision Status</th>
        </tr>
      </thead>
      <tbody>
        {changes.map(({ changeId, resourceStatus, calculationStatus, decisionStatus }) => (
          <tr key={changeId}>
            <td>{changeId}</td>
            <td>{resourceStatus}</td>
            <td>{calculationStatus}</td>
            <td>{decisionStatus}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function GlobalViewPage() {
  const [changes, setChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Attempting to fetch data from databases...');

        const [resourceStatuses, calculationStatuses, decisionStatuses] = await Promise.all([
          getResourceStatuses(),
          getCalculationStatuses(),
          getDecisionStatuses(),
        ]);

        console.log('Data fetched successfully from all databases.');

        const alignedStatuses = alignStatuses(resourceStatuses, calculationStatuses, decisionStatuses);
        setChanges(alignedStatuses);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Navbar />
      <main className={styles.container}>
        <h1 className={styles.title}>Global View</h1>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <DataTable changes={changes} />
        )}
      </main>
    </div>
  );
}
