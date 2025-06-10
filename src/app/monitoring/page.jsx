'use client';

import { useEffect, useState } from 'react';
import { getAllChangeIdStatuses as getResourceStatuses } from '../../slices/shared/openResourceDB';
import { getAllChangeIdStatuses as getCalculationStatuses } from '../../slices/shared/openCalculationDB';
import { getAllChangeIdStatuses as getDecisionStatuses } from '../../slices/shared/openDecisionDB';
import { getLatestPaymentPlan } from '../../slices/shared/openPaymentPlanDB';
import Navbar from '../../../components/Navbar';
import styles from './monitoring.module.css';

const formatTimestamp = (timestamp) => {
  if (timestamp === 'Not found') return timestamp;
  const date = new Date(Number(timestamp));
  return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
};

const alignStatuses = (resourceStatuses, calculationStatuses, decisionStatuses, paymentPlans) => {
  console.log('Aligning statuses with data:', { resourceStatuses, calculationStatuses, decisionStatuses, paymentPlans });

  const paymentPlansArray = Array.isArray(paymentPlans) ? paymentPlans : paymentPlans ? [paymentPlans] : [];
  console.log('Payment Plans Array:', paymentPlansArray);

  const allChangeIds = new Set([
    ...Object.keys(resourceStatuses),
    ...Object.keys(calculationStatuses),
    ...Object.keys(decisionStatuses),
  ]);
  console.log('All Change IDs:', allChangeIds);

  return Array.from(allChangeIds).map(changeId => {
    const calculationInfo = calculationStatuses[changeId] || {};
    const decisionInfo = decisionStatuses[calculationInfo.calculationId] || {};
    const paymentPlan = paymentPlansArray.find(plan => plan.decisionId === decisionInfo.decisionId) || {};

    const timestamp = decisionInfo.timestamp || calculationInfo.timestamp || resourceStatuses[changeId]?.timestamp || 'Not found';

    const alignedData = {
      changeId,
      resourceStatus: resourceStatuses[changeId] || 'Not found',
      calculationStatus: calculationInfo || 'Not found',
      decisionStatus: decisionInfo || 'Not found',
      decisionId: decisionInfo.decisionId || 'Not found',
      paymentPlanId: paymentPlan.paymentPlanId || 'Not found',
      timestamp,
    };

    console.log('Aligned Data for Change ID:', changeId, alignedData);
    return alignedData;
  });
};

const DataTable = ({ changes }) => {
  console.log('Rendering DataTable with changes:', changes);

  return (
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
              <td>{typeof resourceStatus === 'object' ? JSON.stringify(resourceStatus) : resourceStatus}</td>
              <td>{typeof calculationStatus === 'object' ? JSON.stringify(calculationStatus) : calculationStatus}</td>
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
};

export default function MonitoringPage() {
  const [changes, setChanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting to fetch data...');
        const [resourceStatuses, calculationStatuses, decisionStatuses, latestPaymentPlan] = await Promise.all([
          getResourceStatuses(),
          getCalculationStatuses(),
          getDecisionStatuses(),
          getLatestPaymentPlan(),
        ]);

        console.log('Fetched Data:', {
          resourceStatuses,
          calculationStatuses,
          decisionStatuses,
          latestPaymentPlan
        });

        const alignedStatuses = alignStatuses(resourceStatuses, calculationStatuses, decisionStatuses, latestPaymentPlan);
        console.log('Aligned Statuses:', alignedStatuses);
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
        <h1 className={styles.title}>Monitoring</h1>
        {isLoading ? <div className={styles.loading}>Loading...</div> : <DataTable changes={changes} />}
      </main>
    </div>
  );
}
