'use client';

import { useEffect, useState } from 'react';
import { openResourceDB } from "../../slices/shared/openResourceDB.js";
import Navbar from '../../../components/Navbar';

export default function ProjectionViewPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const db = await openResourceDB();
        const tx = db.transaction("resources", "readonly");
        const store = tx.objectStore("resources");

        const result = await store.getAll();

        // Combined sort - Primary by Month (Desc), Secondary by Timestamp (Desc)
        result.sort((a, b) => {
          const monthComparison = b.month.localeCompare(a.month);
          if (monthComparison !== 0) {
            return monthComparison;
          }
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
    <div>
      <Navbar /> {/* Include the Navbar at the top of the page */}
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
              <tr key={r.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td>{r.EVENT_ID}</td>
                <td>{r.changeId}</td>
                <td>{r.id}</td>
                <td>{r.description}</td>
                <td>{r.amount}</td>
                <td>{r.period?.start ? new Date(r.period.start).toLocaleDateString() : 'N/A'}</td>
                <td>{r.period?.end ? new Date(r.period.end).toLocaleDateString() : 'N/A'}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
