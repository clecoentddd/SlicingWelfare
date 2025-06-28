import { fetchLatestPaymentsFromProjectionDB } from '../shared/openPaymentPlanDB';
import { fetchLatestCalculationsFromProjectionDB } from '../shared/openCalculationDB';
import { computeNetProcessedAmountsPerMonth } from "../shared/computeProcessedTransactions";

export async function fetchAndMergeCalculationPaymentData() {
  console.log('🚀 Starting to fetch and merge calculation and payment data...');

  try {
    // Step 1: Fetch data from projections
    const { latestCalculationId, calculations } = await fetchLatestCalculationsFromProjectionDB();
    console.log('📊 Latest Calculation ID:', latestCalculationId);
    console.log('📉 Raw Calculations:', calculations);

    const { latestPaymentPlanId, payments } = await fetchLatestPaymentsFromProjectionDB();
    console.log('📋 Latest Payment Plan ID:', latestPaymentPlanId);
    console.log('💳 Raw Payments:', payments);

    // Step 2: Use existing utility to get processed payment amounts
    const processedPayments = payments.filter(p => p.status === 'TransactionProcessed');
    console.log('✅ Processed Payments:', processedPayments);

    const netProcessedArray = computeNetProcessedAmountsPerMonth(processedPayments); // [{ month, netAmount }]
    console.log('🧮 Net Processed Amounts Per Month:', netProcessedArray);

    const netProcessedMap = new Map(
      netProcessedArray.map(({ month, netAmount }) => [month, netAmount])
    );

    // Step 3: Compare against calculations to determine if anything is left to pay
   const allSettled = calculations.every(calc => {
  const expected = calc.netAmount || 0;
  const alreadyPaid = netProcessedMap.get(calc.month) || 0;

  const isSettled = expected >= 0
    ? alreadyPaid >= expected          // For regular payments
    : alreadyPaid <= expected;         // For reimbursements

  console.log(`🕵️ Checking month ${calc.month}: expected ${expected}, paid ${alreadyPaid} => settled? ${isSettled}`);
  return isSettled;
});


    if (allSettled) {
      console.log("✅ All payments settled — skipping payment plan creation.");
      return null; // Or [] depending on how it's consumed
    }

    // Step 4: Merge and return
    const mergedData = mergeCalculationAndPaymentData(
      { latestCalculationId, calculations },
      { latestPaymentPlanId, payments }
    );

    console.log('🔗 Merged calculation and payment data:', mergedData);
    return mergedData;

  } catch (err) {
    console.error("❌ Failed to fetch and merge calculation and payment data:", err);
    return [];
  }
}



export function mergeCalculationAndPaymentData({ latestCalculationId, calculations }, { latestPaymentPlanId, payments }) {
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
    if (!paymentMap.has(payment.month)) {
      paymentMap.set(payment.month, {
        totalAmount: 0,
        status: 'NotProcessed',
      });
    }

    const existing = paymentMap.get(payment.month);

    if (payment.status === 'TransactionProcessed') {
      existing.totalAmount += payment.amount;
      existing.status = 'TransactionProcessed'; // once any payment is processed in that month, mark it processed
    }
  });

  const allMonths = new Set([...calculationMap.keys(), ...paymentMap.keys()]);

  return Array.from(allMonths).map(month => {
    const calcData = calculationMap.get(month) || { calculationAmount: 0, calculationId: null };
    const paymentInfo = paymentMap.get(month) || { totalAmount: 0, status: 'NotProcessed' };

    let newAmount;
    let amountAlreadyProcessed;

    if (paymentInfo.status === 'TransactionProcessed') {
      newAmount = calcData.calculationAmount - paymentInfo.totalAmount;
      amountAlreadyProcessed = paymentInfo.totalAmount;
    } else {
      newAmount = calcData.calculationAmount;
      amountAlreadyProcessed = 0;
    }

    return {
      month,
      calculationId: calcData.calculationId,
      calculationAmount: calcData.calculationAmount,
      paymentAlreadyProcessed: amountAlreadyProcessed,
      newAmount,
      paymentPlanId: latestPaymentPlanId,
    };
  });
}
