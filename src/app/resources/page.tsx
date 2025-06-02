'use client';

import { useEffect, useState } from 'react';
import { openResourceDB } from "../../slices/03_viewResources/openResourceDB";

type ResourceRow = {
  id: string; // Add the id field to the type
  month: string;
  type: string;
  description: string;
  amount: number;
  changeId: string;
  status: string;
  timestamp: number;
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
        let result: ResourceRow[] = request.result;

        // Sort by timestamp in descending order
        result.sort((a, b) => b.timestamp - a.timestamp);

        // Sort by month in descending order
        result.sort((a, b) => b.month.localeCompare(a.month));

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
      <th>ID</th>
      <th>Month</th>
      <th>Description</th>
      <th>Type</th>
      <th>Amount</th>
      <th>Status</th>
      <th>Change ID</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((r, idx) => (
      <tr key={idx} style={{ borderBottom: "1px solid #ccc" }}>
        <td>{r.id}</td>
        <td>{r.month}</td>
        <td>{r.description}</td>
        <td>{r.type}</td>
        <td>CHF {r.amount}</td>
        <td>{r.status}</td>
        <td>{r.changeId}</td>
      </tr>
    ))}
  </tbody>
</table>

    </main>
  );
}
