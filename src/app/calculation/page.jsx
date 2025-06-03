"use client";

import { useEffect, useState } from 'react';
import { openCalculationDB } from "../../slices/shared/openCalculationDB";
import styles from './calculation.module.css';
import Navbar from '../../../components/Navbar'; // Import the Navbar component

export default function CalculationViewPage() {
  const [calculations, setCalculations] = useState([]);
  const [filterCalculationId, setFilterCalculationId] = useState('');
  const [filterChangeId, setFilterChangeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const db = await openCalculationDB();
        const tx = db.transaction("monthlyCalculations", "readonly");
        const store = tx.objectStore("monthlyCalculations");

        const result = await store.getAll();

        // Sort by timestamp (most recent first) and then by month (most recent first)
        result.sort((a, b) => {
          if (b.timestamp !== a.timestamp) {
            return b.timestamp - a.timestamp;
          }
          return b.month.localeCompare(a.month);
        });

        setCalculations(result);
      } catch (err) {
        console.error("Failed to fetch from 'monthlyCalculations' store or open CalculationDB:", err);
      }
    }

    fetchData();
  }, []);

  const filteredCalculations = calculations.filter(calc => {
    const matchesCalculationId = calc.calculationId.includes(filterCalculationId);
    const matchesChangeId = calc.changeId.includes(filterChangeId);
    const matchesStatus = calc.status ? calc.status.includes(filterStatus) : false;

    return matchesCalculationId && matchesChangeId && (filterStatus === '' || matchesStatus);
  });

  return (
    <div>
      <Navbar /> {/* Include the Navbar at the top of the page */}
      <main className={styles.container}>
        <h1 className={styles.title}>Monthly Calculations View</h1>
        <div className={styles.filterContainer}>
          <input
            type="text"
            placeholder="Filter by Calculation ID"
            value={filterCalculationId}
            onChange={(e) => setFilterCalculationId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by Change ID"
            value={filterChangeId}
            onChange={(e) => setFilterChangeId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Filter by Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Calculation ID</th>
              <th className={styles.tableHeader}>Change ID</th>
              <th className={styles.tableHeader}>Month</th>
              <th className={styles.tableHeader}>Incomes</th>
              <th className={styles.tableHeader}>Expenses</th>
              <th className={styles.tableHeader}>Result</th>
              <th className={styles.tableHeader}>Status</th>
              <th className={styles.tableHeader}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalculations.map((calc) => (
              <tr key={calc.id} className={styles.tableRow}>
                <td className={styles.tableData}>{calc.calculationId}</td>
                <td className={styles.tableData}>{calc.changeId}</td>
                <td className={styles.tableData}>{calc.month}</td>
                <td className={styles.tableData}>{calc.incomes}</td>
                <td className={styles.tableData}>{calc.expenses}</td>
                <td className={styles.tableData}>{calc.result}</td>
                <td className={styles.tableData}>{calc.type || 'N/A'}</td>
                <td className={styles.tableData}>{new Date(calc.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
