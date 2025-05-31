// src/slices/shared/replayAggregate.ts
import { StoredEvent } from "./genericTypes";
import { getChangeStatus } from "./getStatus";

export function replayAggregate(events: StoredEvent[], changeId: string | null): { changeId: string | null; status: string } {
  if (!changeId) {
    console.log("No changeId provided.");
    return { changeId: null, status: "None" };
  }

  // Use getChangeStatus to determine the current state of the aggregate
  const status = getChangeStatus(events, changeId);

  return { changeId, status };
}
