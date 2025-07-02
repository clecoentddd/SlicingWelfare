'use client';

import React, { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import styles from "./ledger.module.css";
import { getAllLedgerEntries } from "../../slices/shared/openLedgerDB";
import { rebuildLedger, cleanLedger } from "../../slices/24_TheBigBook/rebuildLedger";

const LedgerUI = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLedgerEntries()
      .then((data) => {
        setLedger(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching ledger from IndexedDB:", err);
        setLoading(false);
      });
  }, []);

  const handleClearLedger = async () => {
    await cleanLedger();
    setLedger([]);
    alert("Ledger cleared!");
  };

  const handleRebuildLedger = async () => {
    await rebuildLedger();
    const data = await getAllLedgerEntries();
    setLedger(data);
    alert("Ledger rebuilt!");
  };

  // Group entries by month, separating summaries and regular entries
  const ledgerByMonth = ledger.reduce((acc, entry) => {
    const month = entry.month || "Unknown";
    if (!acc[month]) acc[month] = { summary: null };
    if (entry.type === "Summary") {
      acc[month].summary = entry;
    }
    return acc;
  }, {});

  const monthRows = Object.entries(ledgerByMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, { summary }]) => {
    if (!summary) return null;
    const processed = summary.transactions || [];
    const totalProcessed = typeof summary.totalProcessed === "number" ? summary.totalProcessed : 0;
    const latestCalculation = typeof summary.latestCalculation === "number" ? summary.latestCalculation : 0;
    const balance = typeof summary.balance === "number" ? summary.balance : 0;

    // Split balance into "in our favour" and "in your favour"
    const balanceInOurFavour = balance < 0 ? balance.toFixed(2) : "";
    const balanceInYourFavour = balance > 0 ? balance.toFixed(2) : "";

    // First row: month, latestCalculation, first processed, totalProcessed, balances
    const firstProcessed = processed[0] ? Number(processed[0].amount).toFixed(2) : "";

    const rows = [
      <tr key={month + "-main"}>
        <td>{month}</td>
        <td>{latestCalculation.toFixed(2)}</td>
        <td>{firstProcessed}</td>
        <td>{totalProcessed.toFixed(2)}</td>
        <td>{balanceInOurFavour}</td>
        <td>{balanceInYourFavour}</td>
      </tr>
    ];

    // Additional rows for more processed transactions
    for (let i = 1; i < processed.length; i++) {
      rows.push(
        <tr key={month + "-tx-" + i}>
          <td></td>
          <td></td>
          <td>{Number(processed[i].amount).toFixed(2)}</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      );
    }

    return rows;
  });

  return (
    <>
      <Navbar />
      <div className={styles.ledgerContainer}>
        <h1 className={styles.ledgerTitle}>The Big Book Ledger v1</h1>
        <div className={styles.buttonRow}>
          <button onClick={handleClearLedger} className={styles.rebuildButton}>Clear Ledger</button>
          <button onClick={handleRebuildLedger} className={styles.rebuildButton}>Rebuild Ledger</button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : ledger.length === 0 ? (
          <p>No ledger entries found.</p>
        ) : (
          <table className={styles.ledgerTable}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Latest Calculation</th>
                <th>Processed</th>
                <th>Total Processed</th>
                <th>Balance in our favour</th>
                <th>Balance in your favour</th>
              </tr>
            </thead>
            <tbody>
              {monthRows}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default LedgerUI;