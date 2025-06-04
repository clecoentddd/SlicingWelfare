// src/app/decisions/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { fetchCalculationIds, fetchDecisionsByCalculationId } from "../../slices/08_DecisionsInformation/DecisionsReadModel";
import { validateDecision } from "../../slices/09_DecisionValidation/ValidateCalculation";
import Navbar from '../../../components/Navbar';
import styles from './decision.module.css';

interface Resource {
  id: string;
  description: string;
  amount: number;
}

interface Decision {
  id: string;
  calculationId: string;
  changeId: string;
  month: string;
  type: string;
  timestamp: number;
  incomes: number;
  expenses: number;
  result: number;
  resources: Resource[];
}

export default function DecisionViewPage() {
  const [calculationIds, setCalculationIds] = useState<string[]>([]);
  const [selectedCalculationId, setSelectedCalculationId] = useState('');
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
      fetchDecisionsByCalculationId(selectedCalculationId).then(result => {
        const sortedDecisions = [...result].sort((a, b) => a.month.localeCompare(b.month));
        setDecisions(sortedDecisions);
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
      // Assuming the changeId is the same for all decisions with the same calculationId
      const changeId = decisions.length > 0 ? decisions[0].changeId : '';
      await validateDecision(selectedCalculationId, changeId);
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
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Resources</th>
                  <th>Calculated Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((decision, index) => (
                  <tr key={index}>
                    <td>{decision.month}</td>
                    <td>
                      {decision.resources.length > 0 ? (
                        <div>
                          {decision.resources.map((resource, resourceIndex) => (
                            <div key={resourceIndex} className={styles.resourceEntry}>
                              <p>ID: {resource.id}</p>
                              <p>Description: {resource.description}</p>
                              <p>Amount: {resource.amount}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No resources found</p>
                      )}
                    </td>
                    <td>{decision.result}</td>
                    <td>{decision.type || 'N/A'}</td>
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
