import { v4 as uuidv4 } from 'uuid';
import { fetchProcessedTransactionsFromEventStore } from '../../eventStore/services/GetPaymentsProcessedFromES';
import { replayLatestCalculationFromEvents } from '../../eventStore/services/GetLatestCalculationPlanFromES'; 

export async function updatePaymentPlansCommand(decisionId, calculationId, paymentPlanId) {
  try {
    // Retrieve the latest payment plan and payments from the event store
    const { latestPaymentPlanId, rawTransactions: payments } = await fetchProcessedTransactionsFromEventStore();console.log('Latest payment plan ID retrieved:', latestPaymentPlanId);

    // Retrieve the latest calculation plan and calculations from the database
    const { latestCalculationId, calculations } = await replayLatestCalculationFromEvents();
    console.log('Latest calculation ID retrieved:', latestCalculationId);

    // If there's no latest calculation ID, throw an error
    if (!latestCalculationId) {
      throw new Error('No latest calculation ID plan found.');
    }

    // Check if the calculationId matches the latest one
    if (latestCalculationId !== calculationId) {
      alert(`The provided calculationId (${calculationId}) does not match the latest calculation plan ID (${latestCalculationId}).`);
      throw new Error(`The provided calculationId (${calculationId}) does not match the latest calculation plan ID (${latestCalculationId}).`);
    }

    // If there's no latest payment plan ID, throw an error
    if (!latestPaymentPlanId) {
      throw new Error('No latest payment plan found.');
    }

    // Check if the paymentPlanId matches the latest one
    if (latestPaymentPlanId !== paymentPlanId) {
      alert(`The provided paymentPlanId (${paymentPlanId}) does not match the latest payment plan ID (${latestPaymentPlanId}).`);
      throw new Error(`The provided paymentPlanId (${paymentPlanId}) does not match the latest payment plan ID (${latestPaymentPlanId}).`);
    }

    // Process the calculations and payments to get merged data
    const processedData = processCalculationAndPaymentData(
      { calculations },
      { payments },
      latestPaymentPlanId
    );

    if (!processedData) {
      console.log("✅ No payment plan update required — everything is already settled.");
      return {
        paymentPlanReplacedEvent: null,
        paymentPlanPreparedEvent: null
      };
    }

    // Generate the payment payloads
    const paymentPayloads = generatePaymentPayloads(processedData);

    // Generate a new payment plan ID
    const newPaymentPlanId = uuidv4();

    // Create a PaymentPlanReplaced event
    const paymentPlanReplacedEvent = {
      type: 'PaymentPlanReplaced',
      previousPaymentPlanId: paymentPlanId,
      newPaymentPlanId: newPaymentPlanId,
      aggregate: "PaymentPlan",
      decisionId: decisionId,
      timestamp: new Date().toISOString(),
      payload: {
        oldPaymentPlanId: paymentPlanId,
        newPaymentPlanId,
        decisionId
      }
    };

    const paymentPlanPreparedEvent = {
      type: 'PaymentPlanPreparedInReplacement',
      paymentPlanId: newPaymentPlanId,
      decisionId: decisionId,
      timestamp: Date.now(),
      aggregate: "PaymentPlan",
      eventId: uuidv4(),
      payload: {
        payments: paymentPayloads
      }
    };

    console.log('CRUCIAL: Payment plan prepared event created:', paymentPlanPreparedEvent);

    // Return the events for further handling
    return {
      paymentPlanReplacedEvent,
      paymentPlanPreparedEvent
    };
  } catch (error) {
    console.error("Error processing payments:", error);
    throw error;
  }
}


export function processCalculationAndPaymentData({ calculations }, { payments }, latestPaymentPlanId) {
  console.log('🔍 Creating calculation map by month...');

  const calculationMap = new Map();
  calculations.forEach(calc => {
    const calculationAmount = calc.netAmount || 0;
    calculationMap.set(calc.month, {
      calculationAmount,
      calculationId: calc.calculationId,
    });
  });

  console.log('🔍 Creating payment map by month (only TransactionProcessed)...');
  const paymentMap = new Map();

  payments
    .filter(p => p.status === 'TransactionProcessed')
    .forEach(payment => {
      const existing = paymentMap.get(payment.month) || 0;
      paymentMap.set(payment.month, existing + payment.amount);
    });

  const allMonths = new Set([...calculationMap.keys(), ...paymentMap.keys()]);

  const processedMonths = Array.from(allMonths).map(month => {
    const calcData = calculationMap.get(month) || { calculationAmount: 0, calculationId: null };
    const amountAlreadyProcessed = paymentMap.get(month) || 0;
    const newAmount = calcData.calculationAmount - amountAlreadyProcessed;

    console.log(`📆 ${month}: expected ${calcData.calculationAmount}, paid ${amountAlreadyProcessed} → remaining ${newAmount}`);

    let status;
    if (newAmount < 0) {
      status = "ReimbursementToProcess";
    } else if (newAmount === 0) {
      status = "NoPaymentToProcess";
    } else {
      status = "PaymentToProcess";
    }

    return {
      month,
      calculationId: calcData.calculationId,
      calculationAmount: calcData.calculationAmount,
      paymentAlreadyProcessed: amountAlreadyProcessed,
      newAmount,
      paymentPlanId: latestPaymentPlanId,
      status
    };
  });

  const hasAnyToProcess = processedMonths.some(m => m.status !== "NoPaymentToProcess");

  if (!hasAnyToProcess) {
    console.log("✅ No payments or reimbursements to process. Skipping payment plan creation.");
    return null; // signal to skip
  }

  return processedMonths;
}




function generatePaymentPayloads(processedData) {
  return processedData.map(data => {
    const paymentId = uuidv4();

    return {
      month: data.month,
      paymentId,
      amountAlreadyProcessed: data.paymentAlreadyProcessed,
      calculationAmount: data.calculationAmount,
      amount: data.newAmount,
      status: data.status
    };
  });
}
