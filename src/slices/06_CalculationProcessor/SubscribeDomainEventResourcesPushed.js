// src/slices/06_CalculationProcessor/SubscribeResourcesPushed.js

import { eventEmitter } from '../shared/eventEmitter';
import { retrieveDataForCalculation } from './retrieveDataForCalculation';

export function subscribeToResourcesPushed() {
  const handleDataPushed = (event) => {
    console.log('Event received:', event); // Log the entire event for debugging purposes

    if (event.metadata && event.metadata.domainEvent) {
      console.log('Domain event detected in metadata.');

      // Log the changeId and event.id for clarity
      const changeId = event.payload.changeId;
      const eventId = event.id;

      console.log(`DataPushed domain event received with changeId = ${changeId} and event.id = ${eventId}`);

      // Log the action being taken
      console.log(`Retrieving data for calculation with changeId: ${changeId} and eventId: ${eventId}`);

      // Call the function to retrieve data for calculation
      retrieveDataForCalculation(changeId, eventId);
    } else {
      console.log('Event received without domain event metadata, skipping processing.');
    }
  };

  // Additional code to subscribe to the event source would go here
  console.log('Subscribed to ResourcesPushed events.');
}
