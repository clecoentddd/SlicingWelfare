'use client';

import { useEffect, useState } from 'react';
import { fetchCalculations, filterCalculations } from "../../slices/07_CalculationProjection/calculationReadModel";
import styles from './calculation.module.css';
import Navbar from '../../../components/Navbar'; // Import the Navbar component

export default function CalculationViewPage() {
  const [calculations, setCalculations] = useState([]);
  const [filterCalculationId, setFilterCalculationId] = useState('');
  const [filterChangeId, setFilterChangeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTimestamp, setFilterTimestamp] = useState(''); // New state for timestamp filter

  useEffect(() => {
    async function loadData() {
      const result = await fetchCalculations();
      setCalculations(result);
    }

    loadData();
  }, []);

  const filteredCalculations = filterCalculations(calculations, filterCalculationId, filterChangeId, filterStatus)
    .filter(calc => !filterTimestamp || new Date(calc.timestamp).toLocaleString() === filterTimestamp)
    .sort((a, b) => {
      // Extract numeric month and year from month string format like "MM-YYYY"
      const parseMonthYear = (monthStr) => {
        const parts = monthStr.split('-');
        const month = parseInt(parts[0], 10);
        const year = parseInt(parts[1], 10);
        return { year, month };
      };

      const { year: aYear, month: aMonth } = parseMonthYear(a.month);
      const { year: bYear, month: bMonth } = parseMonthYear(b.month);

      // Sorting logic: First by year, then by month
      if (aYear !== bYear) return bYear - aYear;  // Descending by year
      return bMonth - aMonth;  // Ascending by month (January comes before December)
    });

  // Extract unique timestamps for the filter dropdown
  const uniqueTimestamps = [...new Set(calculations.map(calc => new Date(calc.timestamp).toLocaleString()))];

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
          <select
            value={filterTimestamp}
            onChange={(e) => setFilterTimestamp(e.target.value)}
            className={styles.select}
          >
            <option value="">Select Timestamp</option>
            {uniqueTimestamps.map((ts, index) => (
              <option key={index} value={ts}>
                {ts}
              </option>
            ))}
          </select>
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
                <td className={styles.tableData}>{calc.netAmount !== undefined ? parseFloat(calc.netAmount).toFixed(2) : 'N/A'}</td>
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
