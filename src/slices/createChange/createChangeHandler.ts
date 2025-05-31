import { ChangeAggregate } from "../../aggregates/ChangeAggregate";
import { StoredEvent } from "../shared/genericTypes";
import { openEventDB } from "../../utils/openEventDB";
import { DBEvents } from "../shared/DBEvents";

export async function createChangeHandler(changeId: string, allEvents: StoredEvent[]) {
  const aggregate = new ChangeAggregate();
  console.log("Creating change with ID:", changeId);
  allEvents.forEach(e => aggregate.apply(e));

  if (!aggregate.canCreate()) {
    throw new Error("Change already open");
  }

  const event: StoredEvent = {
    type: "ChangeCreated",
    payload: { changeId, status: "Open" },
    timestamp: Date.now(),
  };

  const db = await openEventDB();
  const tx = db.transaction("events", "readwrite");
  await tx.objectStore("events").add(event);
  await tx.done;

  DBEvents.append(event);
}
