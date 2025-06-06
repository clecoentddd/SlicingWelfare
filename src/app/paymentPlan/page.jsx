"use client";

import React, { useEffect, useState } from 'react';
import { getLatestPaymentPlan } from '../../slices/shared/openPaymentPlanDB';
import { processPayments } from '../../slices/15_PaymentProcessor/PaymentProcessor';
import Navbar from '../../../components/Navbar';
import styles from './paymentPlan.module.css';

const PaymentPlanUI = () => {
  const [paymentPlan, setPaymentPlan] = useState(null);

  useEffect(() => {
    const fetchPaymentPlan = async () => {
      const latestPaymentPlan = await getLatestPaymentPlan();
      setPaymentPlan(latestPaymentPlan);
    };

    fetchPaymentPlan();
  }, []);

  const handleProcessPayments = async () => {
    if (paymentPlan) {
      try {
        const processedPayments = await processPayments(paymentPlan);
        console.log('Processed Payments:', processedPayments);
        alert(`Processed ${processedPayments.length} payments.`);
      } catch (error) {
        console.error("Error processing payments:", error);
        alert("Error processing payments. Please check the console for details.");
      }
    } else {
      alert('No payment plan available to process.');
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.paymentPlanContainer}>
        <h1 className={styles.paymentPlanTitle}>Payment Plan</h1>
        {paymentPlan ? (
          <div className={styles.paymentPlanDetails}>
            <h2 className={styles.paymentPlanId}>Payment Plan ID: {paymentPlan.paymentPlanId}</h2>
            <h3 className={styles.paymentsSubtitle}>Payments:</h3>
            <table className={styles.paymentTable}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment ID</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(paymentPlan.payments).map(([month, details]) => (
                  <tr key={details.paymentId}>
                    <td>{month}</td>
                    <td>{details.Payment}</td>
                    <td>{details.Date}</td>
                    <td>{details.Status}</td>
                    <td>{details.paymentId}</td>
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
