"use client";

import React, { useEffect, useState } from 'react';
import { getAllPayments } from '../../slices/shared/openPaymentPlanDB';
import { processPayments } from '../../slices/15_PaymentProcessor/PaymentProcessor';
import { rebuildProjection } from '../../slices/16_PaymentPlanProcessedProjection/rebuildProjection.js'; // Import the rebuild function
import Navbar from '../../../components/Navbar';
import styles from './paymentPlan.module.css';

const PaymentPlanUI = () => {
  const [payments, setPayments] = useState([]);
  const [decisionId, setDecisionId] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        console.log('Fetching all payments...');
        const allPayments = await getAllPayments();
        console.log('Fetched All Payments:', allPayments);

        // Filter payments by status "PaymentToBeProcessed"
        const acceptableStatuses = ['PaymentToBeProcessed', 'PaymentProcessed']; // Add any additional statuses you want to include
        const filteredPayments = allPayments.filter(payment => acceptableStatuses.includes(payment.Status));

        // Sort payments by month in descending order
        const sortedPayments = filteredPayments.sort((a, b) => {
          const monthA = a.month.split('-')[0];
          const monthB = b.month.split('-')[0];
          return monthB.localeCompare(monthA);
        });

        setPayments(sortedPayments);

        // Assuming the decisionId is the same for all payments in the plan
        if (filteredPayments.length > 0) {
          setDecisionId(filteredPayments[0].decisionId);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      }
    };

    fetchPayments();
  }, []);

  const handleProcessPayments = async () => {
    if (payments.length > 0) {
      try {
        console.log('Processing Payments:', payments);
        const processedPayments = await processPayments({ payments });
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
    await rebuildProjection();
    alert('Projection rebuilt successfully!');
  };

  return (
    <>
      <Navbar />
      <div className={styles.paymentPlanContainer}>
        <h1 className={styles.paymentPlanTitle}>Payment Plan</h1>
            <button onClick={handleRebuildProjection} className={styles.rebuildButton}>
              Rebuild Projection
            </button>
        {payments.length > 0 ? (
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
                {payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{payment.paymentId || 'N/A'}</td>
                    <td>{payment.decisionId || 'N/A'}</td>
                    <td>{payment.month || 'N/A'}</td>
                    <td>{payment.Payment || 'N/A'}</td>
                    <td>{payment.Date || 'N/A'}</td>
                    <td>{payment.Status || 'N/A'}</td>
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
