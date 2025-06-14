import { fetchLatestPayments } from '../shared/openPaymentPlanDB';
import { fetchLatestCalculations } from '../shared/openCalculationDB';

// Core merging logic independent of data sources
function mergeCalculationAndPaymentData({ latestCalculationId, calculations }, { latestPaymentPlanId, payments }) {
  console.log('Creating calculation map by month...');
  const calculationMap = new Map();
  calculations.forEach(calc => {
    const calculationAmount = calc.netAmount || 0;
    calculationMap.set(calc.month, {
      calculationAmount,
      calculationId: calc.calculationId,  // This comes directly from the API
    });
  });

  console.log('Creating payment map by month...');
  const paymentMap = new Map();
  payments.forEach(payment => {
    paymentMap.set(payment.month, {
      amount: payment.amount,
      status: payment.status,
    });
  });

  const allMonths = new Set([...calculationMap.keys(), ...paymentMap.keys()]);

  // Process each month to compute the new amount
  return Array.from(allMonths).map(month => {
    const calcData = calculationMap.get(month) || { calculationAmount: 0, calculationId: null };
    const paymentInfo = paymentMap.get(month) || { amount: 0, status: 'NotProcessed' };

    let newAmount;
    let amountAlreadyProcessed;

    if (paymentInfo.status === 'PaymentProcessed') {
      newAmount = calcData.calculationAmount - paymentInfo.amount;
      amountAlreadyProcessed = paymentInfo.amount;
    } else {
      newAmount = calcData.calculationAmount;
      amountAlreadyProcessed = 0;
    }

    return {
      month,
      calculationId: calcData.calculationId,  // This pulls the calculationId from the calculation map
      calculationAmount: calcData.calculationAmount,
      paymentAlreadyProcessed: amountAlreadyProcessed,
      newAmount,
      paymentPlanId: latestPaymentPlanId
    };
  });
}


// Main function that orchestrates fetching and merging
export async function fetchAndMergeCalculationPaymentData() {
  console.log('Starting to fetch and merge calculation and payment data...');

  try {
    // Fetch calculations and payments
    const { latestCalculationId, calculations } = await fetchLatestCalculations();
    const { latestPaymentPlanId, payments } = await fetchLatestPayments();

    // Log or use latestCalculationId if needed

    // Merge calculation and payment data
    const mergedData = mergeCalculationAndPaymentData(
      { latestCalculationId, calculations },
      { latestPaymentPlanId, payments }
    );

    console.log('Data merged successfully:', mergedData);
    return mergedData;
  } catch (err) {
    console.error("Failed to fetch and merge calculation and payment data:", err);
    return [];
  }
}