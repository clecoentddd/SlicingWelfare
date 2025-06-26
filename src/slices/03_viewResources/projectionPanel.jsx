'use client';

import { useEffect, useState } from 'react';
import { queryResourceProjection, subscribeToResourceUpdates } from '../../slices/03_viewResources/queryResourceProjection.js';
import styles from './projectionPanel.module.css';

export default function ProjectionPanel() {
  const [grouped, setGrouped] = useState({});

  // Process and group data
  const processData = (allResources) => {
    const byMonth = {};
    for (const row of allResources) {
      if (!byMonth[row.month]) byMonth[row.month] = [];
      byMonth[row.month].push(row);
    }

    return Object.keys(byMonth)
      .sort((a, b) => b.localeCompare(a))
      .reduce((acc, month) => {
        acc[month] = byMonth[month];
        return acc;
      }, {});
  };

  useEffect(() => {
    // Subscribe to updates
    const unsubscribe = subscribeToResourceUpdates((newData) => {
      setGrouped(processData(newData));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Resource Projection Table</h2>
      {Object.entries(grouped).map(([month, entries]) => (
        <div key={month} className={styles.monthSection}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th colSpan={5} className={styles.monthHeader}>{month}</th>
              </tr>
              <tr>
                <th className={styles.headerCell}>Description</th>
                <th className={styles.headerCell}>Type</th>
                <th className={styles.headerCell}>Amount</th>
                <th className={styles.headerCell}>Status</th>
                <th className={styles.headerCell}>Event ID</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={i}>
                  <td className={styles.desc}>{entry.description}</td>
                  <td className={styles.type}>{entry.type}</td>
                  <td className={styles.amount}>CHF {entry.amount}</td>
                  <td className={styles.status}>{entry.status}</td>
                  <td className={styles.eventId}>{entry.EVENT_ID}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}