import { replayAggregate } from "../shared/replayAggregate.js";
import { appendEvent } from "../../eventStore/eventRepository.js";
import { cancelChangeCommand } from './cancelChangeCommand.js'; // Import the new command
import { domainEventEmitter } from '../shared/eventEmitter';

export async function cancelChangeHandler(changeId) {
  if (!changeId) {
    console.warn("cancelChangeHandler: No changeId provided. Aborting.");
    alert("No change ID provided for the cancel change operation."); // Inform the user
    return;
  }
    try {
    // 1. Replay the aggregate to determine its current state.
    const { status } = await replayAggregate(changeId);
    console.log(`cancelChangeHandler: Current status of change ${changeId} is '${status}'.`);

    // 2. Execute the command to get the suggested event.
    const suggestedCancelEvent = cancelChangeCommand(changeId, status);
    console.log("cancelChangeHandler: cancelChangeCommand event suggested by command:", suggestedCancelEvent);


    // We should display an alert and stop processing.
    if (suggestedCancelEvent === null) {
      console.warn(`cancelChangeHandler: Command indicated no event due to business rule for changeId: ${changeId}.`);
      alert(`Cannot cancel changes. Change with ID ${changeId} has status "${status}".`);
      return; // Exit the handler, as the command did not suggest an event.
    }
    
    // 3. Append the suggested event to the event store.
    const storedCancelEvent = await appendEvent(suggestedCancelEvent);
    console.log(`cancelChangeHandler: ChangeCancelled event appended. Local DB ID: ${storedCancelEvent.id}, Event ID: ${storedCancelEvent.eventId}`);

    // 4. Trigger side effects.
    // Update the local projection for the 'Change' aggregate.
    console.log("cancelChangeHandler: Triggering cancelledEventHandler for projection update...");
    domainEventEmitter.publish('DataCancelled', storedCancelEvent);
    //console.log("cancelChangeHandler: Projection updated successfully.");

  } catch (err) {
    // This catch block will now only handle *unexpected* errors that occur
    // during replayAggregate, appendEvent, cancelledEventHandler.
    console.error(`cancelChangeHandler: An unexpected error occurred during cancel operation for changeId ${changeId}:`, err);
    alert(`Failed to cancel changes for ID ${changeId}. Please try again. Error: ${err.message}`);
    // Do NOT re-throw the error to prevent it from showing on the webpage.
  }
}
