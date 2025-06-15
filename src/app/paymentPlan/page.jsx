"use client";

import React, { useEffect, useState } from 'react';
import { getAllPayments } from '../../slices/shared/openPaymentPlanDB';
import { processPayments } from '../../slices/15_PaymentProcessor/PaymentProcessor';
import { rebuildProjection } from '../../slices/16_PaymentPlanProcessedProjection/rebuildProjection.js';
import Navbar from '../../../components/Navbar';
import styles from './paymentPlan.module.css';

const PaymentPlanUI = () => {
  const [allPayments, setAllPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [decisionId, setDecisionId] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        console.log('Fetching all payments...');
        const paymentsData = await getAllPayments();
        console.log('Fetched All Payments:', paymentsData);

        // Extract unique timestamps and store them with the original timestamp for sorting
        const uniqueTimestampEntries = paymentsData.reduce((acc, payment) => {
          const localeString = new Date(payment.timestamp).toLocaleString();
          if (!acc.some(entry => entry.localeString === localeString)) {
            acc.push({ localeString, timestamp: payment.timestamp });
          }
          return acc;
        }, []);

        // Sort timestamps in descending order (most recent first)
        uniqueTimestampEntries.sort((a, b) => b.timestamp - a.timestamp);
        setTimestamps(uniqueTimestampEntries.map(entry => entry.localeString));

        // If there are timestamps, select the most recent one by default
        if (uniqueTimestampEntries.length > 0) {
          const mostRecentTimestamp = uniqueTimestampEntries[0].localeString;
          setSelectedTimestamp(mostRecentTimestamp);
        }

        // Store all payments
        setAllPayments(paymentsData);

      } catch (error) {
        console.error('Error fetching payments:', error);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments based on selected timestamp and status
  useEffect(() => {
    if (selectedTimestamp && allPayments.length > 0) {
      // Extract timestamp string equivalent for comparison
      const filtered = allPayments.filter(payment => {
        const paymentDate = new Date(payment.timestamp).toLocaleString();
        return paymentDate === selectedTimestamp;
      });

      // Filter payments by status "PaymentToProcess" or "PaymentProcessed"
      const acceptableStatuses = ['PaymentToProcess', 'PaymentProcessed', 'ReimbursementToProcess'];
      const filteredByStatus = filtered.filter(payment => acceptableStatuses.includes(payment.status));

      // Sort payments by month and year in descending order
      const sortedPayments = filteredByStatus.sort((a, b) => {
        const parseMonthYear = (monthStr) => {
          const parts = monthStr.split('-');
          const month = parseInt(parts[0], 10);
          const year = parseInt(parts[1], 10);
          return { year, month };
        };

        const { year: aYear, month: aMonth } = parseMonthYear(a.month);
        const { year: bYear, month: bMonth } = parseMonthYear(b.month);

        // Sort by year then month, in descending order
        if (aYear !== bYear) return bYear - aYear;
        return bMonth - aMonth;
      });

      setFilteredPayments(sortedPayments);

      // Assuming the decisionId is the same for all payments in the plan
      if (filteredByStatus.length > 0) {
        setDecisionId(filteredByStatus[0].decisionId);
      }
    }
  }, [selectedTimestamp, allPayments]);

  const handleProcessPayments = async () => {
    if (filteredPayments.length > 0) {
      try {
        console.log('Processing Payments:', filteredPayments);
        const processedPayments = await processPayments({ payments: filteredPayments });
        console.log('Processed Payments:', processedPayments);
        alert(`Processed ${processedPayments.length} payments.`);
      } catch (error) {
        console.error('Error processing payments:', error);
        alert("Error processing payments. Please check the console for details.");
      }
    } else {
      alert('No payments available to process.');
    }
  };

  const handleRebuildProjection = async () => {
    try {
      await rebuildProjection();
      alert('Projection rebuilt successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error rebuilding projection:', error);
      alert('Error rebuilding projection. Please check the console for details.');
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.paymentPlanContainer}>
        <h1 className={styles.paymentPlanTitle}>Payment Plan</h1>
        <button onClick={handleRebuildProjection} className={styles.rebuildButton}>
          Rebuild Projection
        </button>

        {/* Timestamp Filter Dropdown */}
        {timestamps.length > 0 && (
          <div className={styles.filterContainer}>
            <label>Filter by Timestamp: </label>
            <select
              value={selectedTimestamp}
              onChange={(e) => setSelectedTimestamp(e.target.value)}
              className={styles.timestampSelect}
            >
              {timestamps.map((ts, index) => (
                <option key={index} value={ts}>
                  {ts}
                </option>
              ))}
            </select>
          </div>
        )}

        {filteredPayments.length > 0 ? (
          <div className={styles.paymentPlanDetails}>
            <table className={styles.paymentTable}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>PaymentPlanID</th>
                  <th>Decision ID</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{payment.paymentId || 'N/A'}</td>
                    <td>{payment.paymentPlanId || 'N/A'}</td>
                    <td>{payment.decisionId || 'N/A'}</td>
                    <td>{payment.month || 'N/A'}</td>
                    <td>{payment.amount ? parseFloat(payment.amount).toFixed(2) : 'N/A'}</td>
                    <td>{payment.date || 'N/A'}</td>
                    <td>{payment.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleProcessPayments} className={styles.processButton}>
              Process Payments
            </button>
          </div>
        ) : (
          <p>No payment plan available.</p>
        )}
      </div>
    </>
  );
};

export default PaymentPlanUI;
