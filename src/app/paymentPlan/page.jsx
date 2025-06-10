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
      try {
        console.log('Fetching payment plan...'); // Log before fetching
        const latestPaymentPlan = await getLatestPaymentPlan();
        console.log('Fetched Payment Plan:', latestPaymentPlan); // Log the fetched payment plan
        setPaymentPlan(latestPaymentPlan);
      } catch (error) {
        console.error('Error fetching payment plan:', error); // Log any errors
      }
    };

    fetchPaymentPlan();
  }, []);

  const handleProcessPayments = async () => {
    if (paymentPlan) {
      try {
        console.log('Processing Payment Plan:', paymentPlan);
        const processedPayments = await processPayments(paymentPlan);
        console.log('Processed Payments:', processedPayments);
        alert(`Processed ${processedPayments.length} payments.`);
      } catch (error) {
        console.error('Error processing payments:', error);
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
                {Object.entries(paymentPlan.payments || {}).map(([month, details]) => {
                  console.log('Payment Details for Month', month, ':', details);
                  return (
                    <tr key={month}>
                      <td>{details?.paymentId || 'N/A'}</td>
                      <td>{paymentPlan.decisionId || 'N/A'}</td>
                      <td>{month}</td>
                      <td>{details?.Payment || 'N/A'}</td>
                      <td>{details?.Date || 'N/A'}</td>
                      <td>{details?.Status || 'N/A'}</td>
                    </tr>
                  );
                })}
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
