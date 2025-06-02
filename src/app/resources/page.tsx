// src/components/ProjectionViewPage.tsx (or wherever your UI component is)
'use client';

import { useEffect, useState } from 'react';
import { openResourceDB } from "../../slices/03_viewResources/openResourceDB"; // Keeping original import path

// Define ResourceRow type
type ResourceRow = {
  id: string;
  month: string; // Format: YYYY-MM
  type: string;
  description: string;
  amount: number;
  changeId: string;
  status: string;
  timestamp: number;
  EVENT_ID: number; // Corrected to match the database property name (uppercase)
};

export default function ProjectionViewPage() {
  const [rows, setRows] = useState<ResourceRow[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const db = await openResourceDB();
        const tx = db.transaction("resources", "readonly");
        const store = tx.objectStore("resources");

        const request = store.getAll();

        request.onsuccess = () => {
          let result: ResourceRow[] = request.result as ResourceRow[];

          // FIX: Combined sort - Primary by Month (Desc), Secondary by Timestamp (Desc)
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
        };

        request.onerror = () => {
          console.error("❌ Failed to fetch from 'resources' store");
        };
      } catch (err) {
        console.error("❌ Failed to open ResourceDB:", err);
      }
    }

    fetchData();
  }, []);

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Resource Projection Table</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Event ID</th>
            <th>ID</th>
            <th>Month</th>
            <th>Description</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Change ID</th>
          </tr>
        </thead>
        {/* FIX: Condense tbody and tr tags to avoid whitespace text nodes */}
        <tbody>{rows.map((r, idx) => (
          <tr key={idx} style={{ borderBottom: "1px solid #ccc" }}>
            <td>{r.EVENT_ID}</td>
            <td>{r.id}</td>
            <td>{r.month}</td>
            <td>{r.description}</td>
            <td>{r.type}</td>
            <td>CHF {r.amount}</td>
            <td>{r.status}</td>
            <td>{r.changeId}</td>
          </tr>
        ))}</tbody>
      </table>
    </main>
  );
}