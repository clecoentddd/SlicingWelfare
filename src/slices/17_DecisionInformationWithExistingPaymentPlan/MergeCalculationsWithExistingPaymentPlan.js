import  { fetchPaymentsByStatus} from '../shared/openPaymentPlanDB';
import { fetchLatestCalculations } from '../shared/openCalculationDB';

export async function fetchAndMergeCalculationPaymentData() {
  console.log('Starting to fetch and merge calculation and payment data...');

  try {
    // Fetch the latest calculations
    console.log('Fetching the latest calculations...');
    const latestCalculations = await fetchLatestCalculations();
    console.log('Latest calculations fetched successfully:', latestCalculations);

    // Fetch payments
    console.log('Fetching payments...');
    const payments = await fetchPaymentsByStatus();
    console.log('Payments fetched successfully:', payments);

    // Create a map of calculations by month
    console.log('Creating calculation map by month...');
    const calculationMap = new Map();
    latestCalculations.forEach(calc => {
      // Log each calculation entry to verify the structure and values
      console.log('Calculation Entry:', {
        month: calc.month,
        amount: calc.amount,
        netAmount: calc.netAmount,
        incomes: calc.incomes,
        expenses: calc.expenses
      });

      // Use netAmount if amount is not available
      const calculationAmount = calc.amount || calc.netAmount || 0;
      calculationMap.set(calc.month, calculationAmount);
    });

    // Create a map of payments by month
    console.log('Creating payment map by month...');
    const paymentMap = new Map();
    payments.forEach(payment => {
      paymentMap.set(payment.month, payment.Payment);
    });

    // Get all unique months from both calculations and payments
    const allMonths = new Set([...calculationMap.keys(), ...paymentMap.keys()]);
    console.log('All unique months:', allMonths);

    // Process each month to compute the new amount
    const mergedData = Array.from(allMonths).map(month => {
      const calculationAmount = calculationMap.get(month) || 0;
      const paymentAmount = paymentMap.get(month) || 0;
      const newAmount = calculationAmount - paymentAmount;

      // Log the merged data for each month
      console.log(`Merged Data for ${month}:`, {
        calculationAmount,
        paymentAmount,
        newAmount
      });

      return {
        month,
        calculationAmount,
        paymentAmount,
        newAmount
      };
    });

    console.log('Data merged successfully:', mergedData);
    return mergedData;
  } catch (err) {
    console.error("Failed to fetch and merge calculation and payment data:", err);
    return [];
  }
}

