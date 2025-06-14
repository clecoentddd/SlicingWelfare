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

        // Extract unique timestamps and format them for display
        const uniqueTimestamps = [...new Set(paymentsData.map(payment =>
          new Date(payment.timestamp).toLocaleString()))];

        // Sort timestamps in descending order (most recent first)
        uniqueTimestamps.sort((a, b) => new Date(b) - new Date(a));
        setTimestamps(uniqueTimestamps);

        // If there are timestamps, select the most recent one by default
        if (uniqueTimestamps.length > 0) {
          const mostRecentTimestamp = uniqueTimestamps[0];
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

  // Filter payments based on selected timestamp
  useEffect(() => {
    if (selectedTimestamp && allPayments.length > 0) {
      const filtered = allPayments.filter(payment => {
        const paymentDate = new Date(payment.timestamp).toLocaleString();
        return paymentDate === selectedTimestamp;
      });

      // Filter payments by status "PaymentToProcess" or "PaymentProcessed"
      const acceptableStatuses = ['PaymentToProcess', 'PaymentProcessed'];
      const filteredByStatus = filtered.filter(payment => acceptableStatuses.includes(payment.status));

      // Sort payments by month in descending order
      const sortedPayments = filteredByStatus.sort((a, b) => {
        const monthA = a.month.split('-')[0];
        const monthB = b.month.split('-')[0];
        return monthB.localeCompare(monthA);
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
                    <td>{payment.decisionId || 'N/A'}</td>
                    <td>{payment.month || 'N/A'}</td>
                    <td>{payment.amount || 'N/A'}</td>
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
