import { fetchPaymentsByStatus } from '../shared/openPaymentPlanDB';
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
    const paymentsResult = await fetchPaymentsByStatus();
    const { latestPaymentPlanId, payments } = paymentsResult;
    console.log('Payments fetched successfully:', payments);

    // Create a map of calculations by month
    console.log('Creating calculation map by month...');
    const calculationMap = new Map();
    latestCalculations.forEach(calc => {
      console.log('Calculation Entry:', {
        month: calc.month,
        netAmount: calc.netAmount,
        incomes: calc.incomes,
        expenses: calc.expenses,
        calculationId: calc.calculationId
      });

      const calculationAmount = calc.netAmount || 0;
      calculationMap.set(calc.month, {
        calculationAmount,
        calculationId: calc.calculationId
      });
    });

    // Create a map of payments by month, including their status
    console.log('Creating payment map by month...');
    const paymentMap = new Map();
    payments.forEach(payment => {
      paymentMap.set(payment.month, {
        amount: payment.Payment,
        status: payment.Status
      });
    });
    console.log('Payment map created successfully:', paymentMap);
    // Get all unique months from both calculations and payments
    const allMonths = new Set([...calculationMap.keys(), ...paymentMap.keys()]);
    console.log('All unique months:', allMonths);

    // Process each month to compute the new amount
    const mergedData = Array.from(allMonths).map(month => {
      const calcData = calculationMap.get(month) || { calculationAmount: 0, calculationId: null };
      const paymentInfo = paymentMap.get(month) || { amount: 0, status: 'NotProcessed' };

      console.log(`----Processing month: ${month}`);
      console.log('----Calculation Data:', calcData);
      console.log('----Payment Data:', paymentInfo);  

      let newAmount;
      if (paymentInfo.status === 'PaymentProcessed') {
        newAmount = calcData.calculationAmount - paymentInfo.amount;
      } else {
        newAmount = calcData.calculationAmount;
      }

      console.log(`Merged Data for ${month}:`, {
        calculationAmount: calcData.calculationAmount,
        calculationId: calcData.calculationId,
        paymentAmount: paymentInfo.amount,
        paymentStatus: paymentInfo.status,
        newAmount
      });

      return {
        month,
        calculationAmount: calcData.calculationAmount,
        calculationId: calcData.calculationId,
        paymentAmount: paymentInfo.amount,
        paymentStatus: paymentInfo.status,
        newAmount,
        paymentPlanId: latestPaymentPlanId // Include the latest paymentPlanId in the returned data
      };
    });

    console.log('Data merged successfully:', mergedData);
    return mergedData;
  } catch (err) {
    console.error("Failed to fetch and merge calculation and payment data:", err);
    return [];
  }
}
