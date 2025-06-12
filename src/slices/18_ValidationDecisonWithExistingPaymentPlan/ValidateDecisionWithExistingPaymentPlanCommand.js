import { v4 as uuidv4 } from 'uuid';
import { getCalculationById } from "../../eventStore/eventRepository";

export async function validationDecisionWithExistingPaymentPlanCommand(calculationId, changeId, paymentPlanId) {
  try {
    // Check if paymentPlanId is provided
    if (!paymentPlanId) {
      throw new Error('Payment Plan ID is required.');
    }

    // Retrieve the CalculationPerformed event to get the monthly calculations
    console.log(`validationDecisionCommand: Retrieving CalculationPerformed event for calculationId: ${calculationId}`);
    const calculationEvent = await getCalculationById(calculationId);

    if (!calculationEvent) {
      throw new Error(`CalculationPerformed event not found for calculationId: ${calculationId}`);
    }

    console.log(`validationDecisionCommand: CalculationPerformed event retrieved successfully for calculationId: ${calculationId}`);

    const { monthlyCalculations } = calculationEvent.payload;

    if (!monthlyCalculations) {
      throw new Error(`monthlyCalculations not found in CalculationPerformed event`);
    }

    // Aggregate monthly calculations into a single payload
    const aggregatedCalculations = Object.entries(monthlyCalculations).map(([month, calculation]) => ({
      month,
      ...calculation
    }));

    // Create a single DecisionCalculationValidated event
    const decisionEvent = {
      type: "DecisionCalculationValidatedWithExistingPaymentPlan",
      decisionId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Decision",
      payload: {
        calculationId,
        changeId,
        paymentPlanId, // Include paymentPlanId in the payload
        calculations: aggregatedCalculations // Include all monthly calculations
      }
    };

    return decisionEvent;
  } catch (error) {
    console.error("Error in validationDecisionCommand:", error);
    throw error;
  }
}
