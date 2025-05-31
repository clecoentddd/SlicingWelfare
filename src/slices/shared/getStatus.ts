import { StoredEvent } from "./genericTypes";

export function getChangeStatus(events: StoredEvent[], changeId: string | null): string {
  if (!changeId) {
    console.log("No changeId provided.");
    return "None";
  }

  console.log(`Filtering events for changeId: ${changeId}`);
  const changeEvents = events.filter(event => event.payload.changeId === changeId);

  console.log(`Found ${changeEvents.length} events for changeId: ${changeId}`);

  // Log each event for debugging
  changeEvents.forEach((event, index) => {
    console.log(`Event ${index}:`, {
      type: event.type,
      timestamp: event.timestamp,
      payload: event.payload
    });
  });

  // Sort events by timestamp to ensure chronological order
  changeEvents.sort((a, b) => b.timestamp - a.timestamp);

  console.log("Events sorted by timestamp.");

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