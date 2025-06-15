'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAndMergeCalculationPaymentData } from "../../slices/17_DecisionInformationWithExistingPaymentPlan/MergeCalculationsWithExistingPaymentPlan";
import { validationDecisionWithExistingPaymentPlanHandler } from "../../slices/18_ValidationDecisonWithExistingPaymentPlan/ValidateDecisionWithExistingPaymentPlanHandler";
import Navbar from '../../../components/Navbar';
import styles from './page.module.css';

export default function DecisionViewPage() {
  const [mergedData, setMergedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // State for storing any error

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null); // Reset error state at the start of a new fetch

      try {
        const mergedDataResult = await fetchAndMergeCalculationPaymentData();

        // Sort the merged data by month in descending order
        const sortedData = mergedDataResult.sort((a, b) => {
          const [aMonth, aYear] = a.month.split('-').map(Number);
          const [bMonth, bYear] = b.month.split('-').map(Number);

          // Compare years first, then months
          if (aYear !== bYear) {
            return bYear - aYear;
          } else {
            return bMonth - aMonth;
          }
        });

        setMergedData(sortedData);
      } catch (error) {
        console.error('Error fetching merged data:', error);
        setError('Failed to fetch merged data'); // Set error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoize the sorted data to avoid unnecessary recalculations
  const sortedMergedData = useMemo(() => {
    return [...mergedData].sort((a, b) => {
      const [aMonth, aYear] = a.month.split('-').map(Number);
      const [bMonth, bYear] = b.month.split('-').map(Number);
      if (aYear !== bYear) {
        return bYear - aYear;
      } else {
        return bMonth - aMonth;
      }
    });
  }, [mergedData]);

  const handleValidateDecision = async () => {
    try {
      const latestCalculation = mergedData.length > 0 ? mergedData[0] : null;
      if (!latestCalculation) {
        alert('No calculation data available to validate.');
        return;
      }

      // Extract necessary IDs from the latest calculation
      const calculationId = latestCalculation.calculationId;
      const changeId = latestCalculation.changeId;
      const paymentPlanId = latestCalculation.paymentPlanId; // Extract paymentPlanId

      // Validate that the necessary IDs are present
      if (!calculationId) {
        alert('Calculation ID is missing in the latest calculation data.');
        return;
      }

      if (!paymentPlanId) {
        alert('Payment Plan ID is missing in the latest calculation data.');
        return;
      }

      // Call the handler with the extracted IDs
      await validationDecisionWithExistingPaymentPlanHandler(calculationId, changeId, paymentPlanId);
      alert('Decision validated successfully!');
    } catch (error) {
      console.error("Error validating decision:", error);
      alert('Failed to validate decision');
    }
  };

  return (
    <div>
      <Navbar />
      <main className={styles.container}>
        <h1 className={styles.title}>Decision View with Existing Payment Plan</h1>
        <h2>Calculation ID: {mergedData[0]?.calculationId || 'No Calculation ID'}</h2>
        <h2>Payment Plan ID: {mergedData[0]?.paymentPlanId || 'No Payment Plan ID'}</h2>
        <div className={styles.filterContainer}>
          <button onClick={handleValidateDecision} className={styles.validateButton}>
            Validate Decision
          </button>
        </div>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.tableContainer}>
            <h2>Calculations and Payments</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Calculation Amount</th>
                  <th>Payment Already Made</th>
                  <th>Amount to be paid or reimbursed</th>
                </tr>
              </thead>
              <tbody>
                {sortedMergedData.map((data, index) => (
                  <tr key={index}>
                    <td>{data.month}</td>
                    <td>{data.calculationAmount.toFixed(2)}</td>
                    <td>{data.paymentAlreadyProcessed.toFixed(2)}</td>
                    <td>{data.newAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
