'use client';

import { useEffect, useState } from 'react';
import { fetchAndMergeCalculationPaymentData } from "../../slices/17_DecisionInformationWithExistingPaymentPlan/MergeCalculationsWithExistingPaymentPlan";
import { validationDecisionHandler } from "../../slices/09_DecisionValidation/validationDecisionHandler";
import Navbar from '../../../components/Navbar';
import styles from './page.module.css';

export default function DecisionViewPage() {
  const [mergedData, setMergedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchAndMergeCalculationPaymentData().then((mergedDataResult) => {
      setMergedData(mergedDataResult);
      setIsLoading(false);
    });
  }, []);

  const handleValidateDecision = async () => {
    try {
      const latestCalculation = mergedData.length > 0 ? mergedData[0] : null;
      if (!latestCalculation) {
        alert('No calculation data available to validate.');
        return;
      }

      // Placeholder for calculationId and changeId, replace with actual logic
      const calculationId = 'latestCalculationId'; // Replace with actual logic to get the ID
      const changeId = 'latestChangeId'; // Replace with actual logic to get the ID

      await validationDecisionHandler(calculationId, changeId);
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
        <h1 className={styles.title}>Decision View</h1>
        <div className={styles.filterContainer}>
          <button onClick={handleValidateDecision} className={styles.validateButton}>
            Validate Decision
          </button>
        </div>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.tableContainer}>
            <h2>Calculations and Payments</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Calculation Amount</th>
                  <th>Payment Amount</th>
                  <th>Net Result</th>
                </tr>
              </thead>
              <tbody>
                {mergedData.map((data, index) => (
                  <tr key={index}>
                    <td>{data.month}</td>
                    <td>{data.calculationAmount}</td>
                    <td>{data.paymentAmount}</td>
                    <td>{data.newAmount}</td>
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
