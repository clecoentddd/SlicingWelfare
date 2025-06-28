'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { queryResourceProjection } from '../../slices/03_viewResources/queryResourceProjection.js';
import styles from './resources.module.css';

export default function ProjectionViewPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await queryResourceProjection();
      setRows(data);
    }
    fetchData();
  }, []);

  // First, sort all rows by month (assuming format "MM-YYYY")
  const groupedByMonth = rows
    .sort((a, b) => {
      const [aMonth, aYear] = a.month.split('-').map(Number);
      const [bMonth, bYear] = b.month.split('-').map(Number);
      return bYear - aYear || bMonth - aMonth;
    })
    .reduce((acc, row) => {
      if (!acc[row.month]) {
        acc[row.month] = [];
      }
      acc[row.month].push(row);
      return acc;
    }, {});

  // Create an array of months sorted descending
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    const [aM, aY] = a.split('-').map(Number);
    const [bM, bY] = b.split('-').map(Number);
    return bY - aY || bM - aM;
  });

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.mainContent}>
        <h1 className={styles.title}>resource Projection View</h1>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event ID</th>
              <th>Description</th>
              <th>Incomes</th>
              <th>Expenses</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedMonths.map((month) => {
              // Sort entries alphabetically by description within the month
              const entries = groupedByMonth[month].sort((a, b) =>
                a.description.localeCompare(b.description)
              );
              return (
                <React.Fragment key={month}>
                  <tr className={styles.monthRow}>
                    <td colSpan="5" className={styles.monthLabel}>
                      Month: {month}
                    </td>
                  </tr>
                  {entries.map((item) => (
                    <tr
                      key={item.EVENT_ID}
                      className={
                        item.type === 'Income'
                          ? styles.incomeRow
                          : styles.expenseRow
                      }
                    >
                      <td>{item.EVENT_ID}</td>
                      <td>{item.description}</td>
                      <td className={`${styles.amount} ${item.type === 'Income' ? styles.incomeCell : ''}`}>
                        {item.type === 'Income' ? `${item.amount} CHF` : ''}
                      </td>
                      <td className={`${styles.amount} ${item.type === 'Expense' ? styles.expenseCell : ''}`}>
                        {item.type === 'Expense' ? `${item.amount} CHF` : ''}
                      </td>
                      <td className={styles.status}>{item.status}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </main>
    </div>
  );
}
