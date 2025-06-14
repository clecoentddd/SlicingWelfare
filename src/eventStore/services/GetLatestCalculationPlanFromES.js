import { getAllEvents } from '../eventRepository.js';

export async function replayLatestCalculationFromEvents() {
  console.log("[CalculationReplayService] Starting replay of CalculationPerformed events to find latest calculation ID.");

  const allEvents = await getAllEvents();
  let latestCalculationEvent = null;
  const calculations = [];

  // Filter for "CalculationPerformed" events
  const calculationPerformedEvents = allEvents.filter(
    event => event.type === "CalculationPerformed"
  );

  console.log(`[CalculationReplayService] Found ${calculationPerformedEvents.length} CalculationPerformed events.`);

  // Determine the latest CalculationPerformed event
  calculationPerformedEvents.forEach(event => {
    // Log each event's timestamp and calculationId for debugging
    console.log(`[CalculationReplayService] Processing CalculationPerformed event with timestamp: ${event.timestamp} and calculationId: ${event.calculationId}`);

    if (!latestCalculationEvent || event.timestamp > latestCalculationEvent.timestamp) {
      latestCalculationEvent = event;
      console.log(`[CalculationReplayService] Updated latest calculation ID to: ${latestCalculationEvent.calculationId} with timestamp: ${event.timestamp}`);
    }
  });

  // Log the final latest calculation event details
  if (latestCalculationEvent) {
    console.log("[CalculationReplayService] Latest CalculationPerformed event ID:", latestCalculationEvent.calculationId, "Timestamp:", latestCalculationEvent.timestamp);
  } else {
    console.log("[CalculationReplayService] No CalculationPerformed events found.");
  }

  // Process CalculationPerformed events to extract monthly calculations data
  calculationPerformedEvents.forEach(event => {
    console.log(`[CalculationReplayService] Processing event with calculationId: ${event.calculationId}`);
    const { payload: { monthlyCalculations } } = event;

    if (monthlyCalculations) {
      // Log monthly calculations for further debugging information
      console.log(`[CalculationReplayService] Found monthly calculations for calculationId: ${event.calculationId}`);

      // Convert monthlyCalculations object to an array of calculation objects
      Object.entries(monthlyCalculations).forEach(([month, values]) => {
        calculations.push({
          month,
          ...values
        });
        console.log(`[CalculationReplayService] Added monthly calculation for month: ${month}, values:`, values);
      });
    } else {
      console.log(`[CalculationReplayService] No monthly calculations found in event with calculationId: ${event.calculationId}`);
    }
  });

  // Log the final calculations array length for completeness
  console.log(`[CalculationReplayService] Processed ${calculations.length} monthly calculation entries.`);

  // Return latestCalculationId and calculations in a format matching fetchPaymentsByStatus
  return {
    latestCalculationId: latestCalculationEvent ? latestCalculationEvent.calculationId : null,
    calculations
  };
}

