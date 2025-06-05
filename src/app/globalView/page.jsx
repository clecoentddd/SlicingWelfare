'use client';

import { useEffect, useState } from 'react';
import { getAllChangeIdStatuses as getResourceStatuses } from '../../slices/shared/openResourceDB';
import { getAllChangeIdStatuses as getCalculationStatuses } from '../../slices/shared/openCalculationDB';
import { getAllChangeIdStatuses as getDecisionStatuses } from '../../slices/shared/openDecisionDB';
import Navbar from '../../../components/Navbar';
import styles from './globalView.module.css';

const formatTimestamp = (timestamp) => {
  if (timestamp === 'Not found') {
    console.log('Timestamp not found for this entry.');
    return timestamp;
  }

  console.log('Raw timestamp value:', timestamp);

  // Ensure the timestamp is treated as a number and is in milliseconds
  const date = new Date(Number(timestamp));
  console.log('Converted date object:', date);

  if (isNaN(date.getTime())) {
    console.error('Invalid timestamp value:', timestamp);
    return 'Invalid Date';
  }

  const formattedDate = date.toLocaleString();
  console.log('Formatted timestamp:', formattedDate);
  return formattedDate;
};

const alignStatuses = (resourceStatuses, calculationStatuses, decisionStatuses) => {
  console.log('Aligning statuses and timestamps...');
  const allChangeIds = new Set([
    ...Object.keys(resourceStatuses),
    ...Object.keys(calculationStatuses),
    ...Object.keys(decisionStatuses),
  ]);

  const aligned = Array.from(allChangeIds).map(changeId => {
    const timestamp = decisionStatuses[changeId]?.timestamp || calculationStatuses[changeId]?.timestamp || resourceStatuses[changeId]?.timestamp || 'Not found';
    console.log(`Timestamp for changeId ${changeId}:`, timestamp);
    return {
      changeId,
      resourceStatus: resourceStatuses[changeId] || 'Not found',
      calculationStatus: calculationStatuses[changeId] || 'Not found',
      decisionStatus: decisionStatuses[changeId] || 'Not found',
      timestamp,
    };
  });

  console.log('Statuses and timestamps aligned successfully:', aligned);
  return aligned;
};

const DataTable = ({ changes }) => {
  console.log('Rendering DataTable with changes:', changes);
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Change ID</th>
            <th>Resource Status</th>
            <th>Calculation Status</th>
            <th>Decision Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {changes.map(({ changeId, resourceStatus, calculationStatus, decisionStatus, timestamp }) => (
            <tr key={changeId}>
              <td>{changeId}</td>
              <td>{resourceStatus}</td>
              <td>{calculationStatus}</td>
              <td>{decisionStatus}</td>
              <td>{formatTimestamp(timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
        console.log('Resource statuses:', resourceStatuses);
        console.log('Calculation statuses:', calculationStatuses);
        console.log('Decision statuses:', decisionStatuses);

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
