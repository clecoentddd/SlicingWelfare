"use client";

import { useEffect, useState } from "react";
import { openResourceDB, getAllFromStore } from "../shared/openResourceDB";
import styles from "./projectionPanel.module.css";

export default function ProjectionPanel() {
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    async function load() {
      const db = await openResourceDB();
      const tx = db.transaction("resources", "readonly");
      const store = tx.objectStore("resources");

      const all = await getAllFromStore(store);

      // Sort by timestamp in descending order
      const sorted = all.sort((a, b) => b.timestamp - a.timestamp);

      // Group by month
      const byMonth = {};
      for (const row of sorted) {
        if (!byMonth[row.month]) byMonth[row.month] = [];
        byMonth[row.month].push(row);
      }

      // Sort the grouped data by month in descending order
      const sortedGrouped = Object.keys(byMonth)
        .sort((a, b) => b.localeCompare(a)) // Sort months in descending order
        .reduce((acc, month) => {
          acc[month] = byMonth[month];
          return acc;
        }, {});

      setGrouped(sortedGrouped);
    }

    load();
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
