import { v4 as uuidv4 } from 'uuid';
import { getCalculationById } from "../../eventStore/eventRepository";

export async function validationDecisionCommand(calculationId, changeId) {
  try {
    console.log(`🔍 Retrieving CalculationPerformed event for calculationId: ${calculationId}`);
    const calculationEvent = await getCalculationById(calculationId);

    if (!calculationEvent) {
      throw new Error(`❌ CalculationPerformed event not found for calculationId: ${calculationId}`);
    }

    const { monthlyCalculations } = calculationEvent.payload;

    if (!monthlyCalculations) {
      throw new Error(`❌ monthlyCalculations not found in CalculationPerformed event`);
    }

    const aggregatedCalculations = Object.entries(monthlyCalculations).map(([month, calculation]) => ({
      month,
      ...calculation
    }));

    const decisionEvent = {
      type: "DecisionCalculationValidated",
      decisionId: uuidv4(),
      timestamp: Date.now(),
      aggregate: "Decision",
      payload: {
        calculationId,
        changeId,
        calculations: aggregatedCalculations
      }
    };

    console.log(`✅ DecisionCalculationValidated event created (not yet stored):`, decisionEvent);
    return decisionEvent;

  } catch (error) {
    console.error("❌ Error in validationDecisionCommand:", error);
    throw error;
  }
}
