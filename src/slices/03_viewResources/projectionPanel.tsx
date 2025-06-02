"use client";

import { useEffect, useState } from "react";
import { openResourceDB, getAllFromStore } from "./openResourceDB";
import styles from "./projectionPanel.module.css";

type ResourceRow = {
  month: string;
  type: string;
  description: string;
  amount: number;
  changeId: string;
  status: string;
  timestamp: number;
};

export default function ProjectionPanel() {
  const [grouped, setGrouped] = useState<Record<string, ResourceRow[]>>({});

 useEffect(() => {
  async function load() {
    const db = await openResourceDB();
    const tx = db.transaction("resources", "readonly");
    const store = tx.objectStore("resources");

    const all: ResourceRow[] = await getAllFromStore<ResourceRow>(store);

    // Sort by timestamp in descending order
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp);

    // Group by month
    const byMonth: Record<string, ResourceRow[]> = {};
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
      }, {} as Record<string, ResourceRow[]>);

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
                <th colSpan={4} className={styles.monthHeader}>{month}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={i}>
                  <td className={styles.desc}>{entry.description}</td>
                  <td className={styles.type}>{entry.type}</td>
                  <td className={styles.amount}>CHF {entry.amount}</td>
                  <td className={styles.status}>{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
