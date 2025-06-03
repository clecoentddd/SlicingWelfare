'use client';

import { useEffect, useState } from 'react';
// Update the import path to the .js version of your ResourceDB opener
import { openResourceDB } from "../../slices/shared/openResourceDB.js"; // Note: Using the new name from your previous conversion

export default function ProjectionViewPage() {
  // Removed the ResourceRow type annotation from useState
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const db = await openResourceDB();
        const tx = db.transaction("resources", "readonly");
        const store = tx.objectStore("resources");

        // The result will be an array of plain JavaScript objects directly from the store.getAll()
        const result = await store.getAll();

        // Combined sort - Primary by Month (Desc), Secondary by Timestamp (Desc)
        result.sort((a, b) => {
          // Primary sort: month in descending order (e.g., '2025-03' before '2025-01')
          const monthComparison = b.month.localeCompare(a.month);
          if (monthComparison !== 0) {
            return monthComparison;
          }
          // Secondary sort: if months are the same, sort by timestamp in descending order
          return b.timestamp - a.timestamp;
        });

        setRows(result);

      } catch (err) {
        console.error("❌ Failed to fetch from 'resources' store or open ResourceDB:", err);
      }
    }

    fetchData();
  }, []);

 return (
    <main style={{ padding: "1rem" }}>
      <h1>Projection View</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333" }}>
            <th>Event ID</th>
            <th>Change ID</th>
            <th>Resource ID</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Period Start</th>
            <th>Period End</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            // **THE MOST ROBUST FIX:** Entire <tr> content on a single line
            <tr key={r.id} style={{ borderBottom: "1px solid #ccc" }}><td>{r.EVENT_ID}</td><td>{r.changeId}</td><td>{r.id}</td><td>{r.description}</td><td>{r.amount}</td><td>{r.period?.start ? new Date(r.period.start).toLocaleDateString() : 'N/A'}</td><td>{r.period?.end ? new Date(r.period.end).toLocaleDateString() : 'N/A'}</td><td>{r.status}</td></tr>
          ))}
        </tbody>
      </table>
      {/* ... (rest of your component) ... */}
    </main>
  );
}