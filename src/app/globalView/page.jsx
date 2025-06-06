'use client';

import { useEffect, useState } from 'react';
import { getAllChangeIdStatuses as getResourceStatuses } from '../../slices/shared/openResourceDB';
import { getAllChangeIdStatuses as getCalculationStatuses } from '../../slices/shared/openCalculationDB';
import { getAllChangeIdStatuses as getDecisionStatuses } from '../../slices/shared/openDecisionDB';
import { getLatestPaymentPlan } from '../../slices/14_PaymentPlanProjection/PaymentPlanProjection';
import Navbar from '../../../components/Navbar';
import styles from './globalView.module.css';

const formatTimestamp = (timestamp) => {
  if (timestamp === 'Not found') return timestamp;
  const date = new Date(Number(timestamp));
  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
};

const alignStatuses = (resourceStatuses, calculationStatuses, decisionStatuses, paymentPlans) => {
  // Ensure paymentPlans is an array
  const paymentPlansArray = Array.isArray(paymentPlans) ? paymentPlans : (paymentPlans ? [paymentPlans] : []);

  const allChangeIds = new Set([
    ...Object.keys(resourceStatuses),
    ...Object.keys(calculationStatuses),
    ...Object.keys(decisionStatuses),
  ]);

  return Array.from(allChangeIds).map(changeId => {
    const decisionInfo = decisionStatuses[changeId] || {};
    const paymentPlan = paymentPlansArray.find(plan => plan.decisionId === decisionInfo.decisionId) || {};

    const timestamp = decisionInfo.timestamp || calculationStatuses[changeId]?.timestamp || resourceStatuses[changeId]?.timestamp || 'Not found';

    return {
      changeId,
      resourceStatus: resourceStatuses[changeId] || 'Not found',
      calculationStatus: calculationStatuses[changeId] || 'Not found',
      decisionStatus: decisionInfo || 'Not found',
      decisionId: decisionInfo.decisionId || 'Not found',
      paymentPlanId: paymentPlan.paymentPlanId || 'Not found',
      timestamp,
    };
  });
};

const DataTable = ({ changes }) => (
  <div className={styles.tableContainer}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Change ID</th>
          <th>Resource Status</th>
          <th>Calculation Status</th>
          <th>Decision Status</th>
          <th>Decision ID</th>
          <th>Payment Plan ID</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {changes.map(({ changeId, resourceStatus, calculationStatus, decisionStatus, decisionId, paymentPlanId, timestamp }) => (
          <tr key={changeId}>
            <td>{changeId}</td>
            <td>{resourceStatus}</td>
            <td>{calculationStatus}</td>
            <td>{typeof decisionStatus === 'object' ? JSON.stringify(decisionStatus) : decisionStatus}</td>
            <td>{decisionId}</td>
            <td>{paymentPlanId}</td>
            <td>{formatTimestamp(timestamp)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function GlobalViewPage() {
  const [changes, setChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourceStatuses, calculationStatuses, decisionStatuses, latestPaymentPlan] = await Promise.all([
          getResourceStatuses(),
          getCalculationStatuses(),
          getDecisionStatuses(),
          getLatestPaymentPlan(),
        ]);

        const alignedStatuses = alignStatuses(resourceStatuses, calculationStatuses, decisionStatuses, latestPaymentPlan);
        setChanges(alignedStatuses);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Navbar />
      <main className={styles.container}>
        <h1 className={styles.title}>Global View</h1>
        {isLoading ? <div className={styles.loading}>Loading...</div> : <DataTable changes={changes} />}
      </main>
    </div>
  );
}
