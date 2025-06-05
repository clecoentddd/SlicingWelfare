// src/components/ProjectionPanel.jsx (assuming this is the path)
'use client';

import { useEffect, useState } from 'react';
// We no longer need openResourceDB or getAllFromStore here
// import { openResourceDB, getAllFromStore } from "../shared/openResourceDB";
import { queryResourceProjection } from '../../slices/03_viewResources/queryResourceProjection.js'; // Import the shared query function
import styles from './projectionPanel.module.css';

export default function ProjectionPanel() {
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    async function loadProjectionData() {
      // Use the shared query function to get the sorted data
      const allResources = await queryResourceProjection();

      // Group by month (this logic remains specific to ProjectionPanel's display)
      const byMonth = {};
      for (const row of allResources) {
        if (!byMonth[row.month]) byMonth[row.month] = [];
        byMonth[row.month].push(row);
      }

      // Sort the grouped data by month in descending order
      // (queryResourceProjection already sorts by month desc, but this ensures group order)
      const sortedGrouped = Object.keys(byMonth)
        .sort((a, b) => b.localeCompare(a)) // Sort months in descending order
        .reduce((acc, month) => {
          acc[month] = byMonth[month];
          return acc;
        }, {});

      setGrouped(sortedGrouped);
    }

    loadProjectionData();
  }, []); // Empty dependency array means this runs once on component mount

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Resource Projection Table</h2>
      {/* Ensure no extra whitespace between table tags to prevent hydration errors */}
      {Object.entries(grouped).map(([month, entries]) => (
        <div key={month} className={styles.monthSection}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th colSpan={5} className={styles.monthHeader}>{month}</th>
              </tr>
              <tr>
                <th className={styles.headerCell}>Description</th><th className={styles.headerCell}>Type</th><th className={styles.headerCell}>Amount</th><th className={styles.headerCell}>Status</th><th className={styles.headerCell}>Event ID</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={i}>
                  <td className={styles.desc}>{entry.description}</td><td className={styles.type}>{entry.type}</td><td className={styles.amount}>CHF {entry.amount}</td><td className={styles.status}>{entry.status}</td><td className={styles.eventId}>{entry.EVENT_ID}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}