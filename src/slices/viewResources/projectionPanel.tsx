"use client";

import { useEffect, useState } from "react";
import { openResourceDB, getAllFromStore } from "./openResourceDB";

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
      const sorted = all.sort((a, b) => b.timestamp - a.timestamp);

      const byMonth: Record<string, ResourceRow[]> = {};

      for (const row of sorted) {
        if (!byMonth[row.month]) byMonth[row.month] = [];
        byMonth[row.month].push(row);
      }

      setGrouped(byMonth);
    }

    load();
  }, []);

  return (
    <div style={{ padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
      <h2>Monthly Projection</h2>
      {Object.entries(grouped).map(([month, entries]) => (
        <div key={month} style={{ marginBottom: "1rem" }}>
          <h3 style={{ color: "#333", marginBottom: "0.5rem" }}>{month}</h3>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {entries.map((entry, i) => (
              <li key={i} style={{ padding: "6px 0", borderBottom: "1px solid #ddd" }}>
                <strong>{entry.description}</strong> — CHF {entry.amount} <br />
                <span style={{ color: "#777" }}>{entry.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
