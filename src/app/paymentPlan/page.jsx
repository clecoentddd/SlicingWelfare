"use client";

import React, { useEffect, useState } from 'react';
import { getLatestPaymentPlan } from '../../slices/14_PaymentPlanProjection/PaymentPlanProjection';
import Navbar from '../../../components/Navbar'; // Import the Navbar component
import styles from './paymentPlan.module.css'; // Import the CSS module

const PaymentPlanUI = () => {
  const [paymentPlan, setPaymentPlan] = useState(null);

  useEffect(() => {
    const fetchPaymentPlan = async () => {
      const latestPaymentPlan = await getLatestPaymentPlan();
      setPaymentPlan(latestPaymentPlan);
    };

    fetchPaymentPlan();
  }, []);

  return (
    <>
      <Navbar />
      <div className={styles.paymentPlanContainer}>
        <h1>Payment Plan</h1>
        {paymentPlan ? (
          <div className={styles.paymentPlanDetails}>
            <h2>Payment ID: {paymentPlan.paymentId}</h2>
            <h3>Payments:</h3>
            <ul>
              {Object.entries(paymentPlan.payments).map(([month, details]) => (
                <li key={month}>
                  <span className={styles.paymentMonth}>{month}</span>
                  <span className={styles.paymentAmount}>Amount: {details.Payment}</span>
                  <span className={styles.paymentDate}>Date: {details.Date}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No payment plan available.</p>
        )}
      </div>
    </>
  );
};

export default PaymentPlanUI;
