'use client';

import { useEffect, useState } from 'react';
import { fetchCalculationIds, fetchCalculationsByCalculationId, fetchAndSortDecisionsByCalculationId } from "../../slices/08_DecisionsInformation/DecisionsReadModel";
import { validationDecisionHandler } from "../../slices/09_DecisionValidation/validationDecisionHandler";
import Navbar from '../../../components/Navbar';
import styles from './decision.module.css';

interface Calculation {
  id: string;
  calculationId: string;
  changeId: string;
  month: string;
  type: string;
  incomes: number;
  expenses: number;
  netAmount: number;
  timestamp: number;
}

interface Decision {
  decisionId: string;
  calculationId: string;
  changeId: string;
  status: string;
  timestamp: number;
}

export default function DecisionViewPage() {
  const [calculationIds, setCalculationIds] = useState<string[]>([]);
  const [selectedCalculationId, setSelectedCalculationId] = useState('');
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCalculationIds().then(ids => {
      setCalculationIds(ids);
    });
  }, []);

  useEffect(() => {
    if (selectedCalculationId) {
      setIsLoading(true);
      Promise.all([
        fetchCalculationsByCalculationId(selectedCalculationId),
        fetchAndSortDecisionsByCalculationId(selectedCalculationId)
      ]).then(([calculationsResult, decisionsResult]) => {
        setCalculations(calculationsResult);
        setDecisions(decisionsResult);
        setIsLoading(false);
      });
    }
  }, [selectedCalculationId]);

  const handleValidateDecision = async () => {
    if (!selectedCalculationId) {
      alert('Please select a Calculation ID');
      return;
    }

    try {
      const changeId = decisions.length > 0 ? decisions[0].changeId : '';
      await validationDecisionHandler(selectedCalculationId, changeId);
      alert('Decision validated successfully!');

      // Refresh decisions after validation
      const updatedDecisions = await fetchAndSortDecisionsByCalculationId(selectedCalculationId);
      setDecisions(updatedDecisions);
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
          <select
            value={selectedCalculationId}
            onChange={(e) => setSelectedCalculationId(e.target.value)}
            className={styles.select}
          >
            <option value="">Select Calculation ID</option>
            {calculationIds.map((id, index) => (
              <option key={index} value={id}>{id}</option>
            ))}
          </select>
          <button onClick={handleValidateDecision} className={styles.validateButton}>
            Validate Decision
          </button>
        </div>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div>
            <div className={styles.tableContainer}>
              <h2>Calculations</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Calculation ID</th>
                    <th>Month</th>
                    <th>Type</th>
                    <th>Incomes</th>
                    <th>Expenses</th>
                    <th>Net Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((calculation, index) => (
                    <tr key={index}>
                      <td>{calculation.calculationId}</td>
                      <td>{calculation.month}</td>
                      <td>{calculation.type}</td>
                      <td>{calculation.incomes}</td>
                      <td>{calculation.expenses}</td>
                      <td>{calculation.netAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.tableContainer}>
              <h2>Decisions</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Decision ID</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((decision, index) => (
                    <tr key={index}>
                      <td>{decision.decisionId}</td>
                      <td>{decision.status}</td>
                      <td>{new Date(decision.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
