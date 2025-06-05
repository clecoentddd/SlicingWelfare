import { eventEmitter } from '../shared/eventEmitter';
import { retrieveDataForCalculation } from './retrieveDataForCalculation';

export function subscribeToResourcesPushed() {
  const handleDataPushed = (event) => {
    console.log('Event received in subscriber:', event);

    // Check if the event is valid and has the expected structure
    if (!event) {
      console.error('No event received');
      return;
    }

    // Check the top-level 'domainEvent' flag directly
    if (event.domainEvent === true) {
      console.log('Top-level domain event flag detected.');

      // Extract necessary IDs
      const changeId = event.changeId;
      const eventIdForCalculation = event.payload?.eventId; // Optional chaining to safely access nested properties
      const internalEventStoreId = event.id;

      if (!changeId || !eventIdForCalculation) {
        console.error('Missing changeId or eventId in the event payload');
        return;
      }

      console.log(`DataPushed domain event received: changeId = ${changeId}, payload.eventId = ${eventIdForCalculation}, internalEventStoreId = ${internalEventStoreId}`);

      // Log the action being taken
      console.log(`Retrieving data for calculation with changeId: ${changeId} and eventId: ${eventIdForCalculation}`);

      // Call the function to retrieve data for calculation
      retrieveDataForCalculation(changeId, eventIdForCalculation);
    } else {
      console.log('Event received without top-level domainEvent flag set to true, skipping processing.');
    }
  };

  // The event type is "DataPushed"
  const EVENT_NAME_TO_SUBSCRIBE = 'DataPushed';

  // Ensure you are actually subscribing
  eventEmitter.on(EVENT_NAME_TO_SUBSCRIBE, handleDataPushed);

  console.log(`Subscribed to '${EVENT_NAME_TO_SUBSCRIBE}' events.`);
}
