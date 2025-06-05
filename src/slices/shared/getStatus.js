// src/slices/shared/getStatus.js

// StoredEvent was a TypeScript type, so its import is no longer needed in plain JS.
// import { StoredEvent } from "./genericTypes";

/**
 * Determines the status of a change based on its associated events.
 *
 * @param {Array<Object>} events An array of event objects.
 * @param {string | null} changeId The ID of the change to check, or null.
 * @returns {string} The status of the change ("None", "Cancelled", "Pushed", "Committed", "Open", "Unknown").
 */
export function getChangeStatus(events, changeId) { // Removed type annotations
  if (!changeId) {
    console.log("No changeId provided.");
    return "None";
  }

  const changeEvents = events.filter(event => event.changeId === changeId);

  // Log each event for debugging (commented out as in original)
  changeEvents.forEach((event, index) => {
   // console.log(`Event ${index}:`, {
   //   type: event.type,
   //   timestamp: event.timestamp,
   //   payload: event.payload
   // });
  });

  // Sort events by timestamp to ensure chronological order
  // Note: Original code sorts in descending order (b.timestamp - a.timestamp).
  // If you need ascending, change to a.timestamp - b.timestamp.
  changeEvents.sort((a, b) => b.timestamp - a.timestamp);


  // Determine the status based on the latest event
  for (const event of changeEvents) {
    if (event.type === "ChangeCancelled") {
      console.log("Change is Cancelled.");
      return "Cancelled";
    } else if (event.type === "ChangePushed") {
      console.log("Change is Pushed.");
      return "Pushed";
    } else if (event.type === "IncomeAdded" || event.type === "ExpenseAdded") {
      console.log("Change is Committed.");
      return "Committed";
    } else if (event.type === "ChangeCreated") {
      console.log("Change is Open.");
      return "Open";
    }
  }

  console.log("Change status is Unknown.");
  return "Unknown";
}