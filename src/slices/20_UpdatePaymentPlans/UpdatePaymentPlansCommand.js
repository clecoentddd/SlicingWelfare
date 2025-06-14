import { v4 as uuidv4 } from 'uuid';
import { replayPaymentProcessedEvents } from '../../eventStore/services/GetPaymentsProcessedFromES';
import { replayLatestCalculationFromEvents } from '../../eventStore/services/GetLatestCalculationPlanFromES'; 

export async function updatePaymentPlansCommand(decisionId, calculationId, paymentPlanId) {
  try {
    // Retrieve the latest payment plan and payments from the database
    const { latestPaymentPlanId, payments } = await replayPaymentProcessedEvents();
    console.log('Latest payment plan ID retrieved:', latestPaymentPlanId);

    // Retrieve the latest caplculation plan and calculation from the database
    const { latestCalculationId, calculations} = await replayLatestCalculationFromEvents();
    console.log('Latest calculation ID retrieved:', latestCalculationId);
    

    // If there's no latest payment plan ID, throw an error
    if (!latestCalculationId) {
      throw new Error('No latest calculation Id plan found.');
    }

    // Check if the paymentPlanId matches the latest one
    if (latestCalculationId !== calculationId) {
      // Show an alert to the user
      alert(`The provided calculationId (${calculationId}) does not match the latest calculation plan ID (${latestPalatestcalculationIdymentPlanId}).`);
      // Throw an error for further handling
      throw new Error(`The provided calculationId (${calculationId}) does not match the latest calculation plan ID (${latestPalatestcalculationIdymentPlanId}).`);
    }


        // If there's no latest payment plan ID, throw an error
    if (!latestPaymentPlanId) {
      throw new Error('No latest payment plan found.');
    }

    // Check if the paymentPlanId matches the latest one
    if (latestPaymentPlanId !== paymentPlanId) {
      // Show an alert to the user
      alert(`The provided paymentPlanId (${paymentPlanId}) does not match the latest payment plan ID (${latestPaymentPlanId}).`);
      // Throw an error for further handling
      throw new Error(`The provided paymentPlanId (${paymentPlanId}) does not match the latest payment plan ID (${latestPaymentPlanId}).`);
    }

        // Generate the payload for payments using merged data
    const paymentPayloads = generatePayloadPayments(
      { latestCalculationId, calculations },
      { latestPaymentPlanId, payments }
    );

    // Generate a new payment plan ID
    const newPaymentPlanId = uuidv4();

    // Create a PaymentPlanReplaced event
    const paymentPlanReplacedEvent = {
      type: 'PaymentPlanReplaced',
      previousPaymentPlanId: paymentPlanId,
      newPaymentPlanId: newPaymentPlanId,
      aggregate: "PaymentPlan",
      decisionId,
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
      decisionId,
      timestamp: Date.now(), // Using a numeric timestamp similar to your example
      aggregate: "PaymentPlan",
      eventId: uuidv4(), // Generating a unique eventId
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


function generatePayloadPayments({ latestCalculationId, calculations }, { latestPaymentPlanId, payments }) {
  // Step 1: Create maps for calculations and payments by month
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

  // Step 2: Determine all months present in calculations or payments
  const allMonths = new Set([...calculationMap.keys(), ...paymentMap.keys()]);

  // Step 3: Process each month to compute the new amount and other details
  const processedData = Array.from(allMonths).map(month => {
    const calcData = calculationMap.get(month) || { calculationAmount: 0, calculationId: null };
    const paymentInfo = paymentMap.get(month) || { amount: 0, status: 'NothingToDo' };

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
      calculationId: calcData.calculationId,
      calculationAmount: calcData.calculationAmount,
      paymentAlreadyProcessed: amountAlreadyProcessed,
      newAmount,
      paymentPlanId: latestPaymentPlanId
    };
  });

  // Step 4: Generate the new payment plan payloads
  return processedData.map(data => {
    const paymentId = uuidv4(); // Generate a unique ID for each payment
    let status;

    // Determine the status based on the newAmount
    if (data.newAmount < 0) {
      status = "ReimbursementToProcess";
    } else if (data.newAmount === 0) {
      status = "NoPaymentToProcess";
    } else {
      status = "PaymentToProcess";
    }

    return {
      month: data.month,
      paymentId,
      amountAlreadyProcessed: data.paymentAlreadyProcessed,
      calculationAmount: data.calculationAmount,
      amount: data.newAmount, // Absolute value ensures amount is positive
      paymentDate: "Immediate", // Placeholder: update logic according to business rules
      status
    };
  });
}
