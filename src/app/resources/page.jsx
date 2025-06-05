// pages/projection/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { queryResourceProjection } from '../../slices/03_viewResources/queryResourceProjection.js';
import styles from './resources.module.css'; // Import the CSS module

export default function ProjectionViewPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await queryResourceProjection();
      setRows(data);
    }

    fetchData();
  }, []);

  return (
    <div className={styles.container}> {/* Apply container style */}
      <Navbar />
      <main className={styles.mainContent}> {/* Apply mainContent style */}
        <h1 className={styles.title}>Projection View</h1> {/* Apply title style */}
      <table className={styles.table}>
          {/* FIX: Ensure no whitespace between <table> and <thead> */}
          <thead>
            <tr>
              <th>Event ID</th><th>Change ID</th><th>Resource ID</th><th>Description</th><th>Amount</th><th>Type</th><th>Month</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.EVENT_ID}</td>
                <td>{r.changeId}</td>
                <td>{r.id}</td>
                <td>{r.description}</td>
                <td className={styles.amount}>{r.amount} CHF</td>
                <td className={r.type === 'Income' ? styles.typeIncome : styles.typeExpense}>{r.type}</td>
                <td>{r.month}</td>
                <td className={styles.status}>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}