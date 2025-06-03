// src/slices/processorCalculation/processorCalculation.js

// Import eventEmitter.js (assuming it's converted)
import { eventEmitter } from '../shared/eventEmitter.js';

// PushedDomainEvent was likely a TypeScript type, so it's not needed in plain JS.
// If your domainEvents.js file now exports runtime values for events, adjust this.

// Import retrieveDataForCalculation.js (assuming it's converted)
import { retrieveDataForCalculation } from './retrieveDataForCalculation.js';

console.log('Registering event listener for DataPushed event...');

// Removed the 'event: PushedDomainEvent' type annotation
eventEmitter.on('DataPushed', (event) => {
  console.log(`Pushed domainEvent received with changeId = ${event.payload.changeId}`);
  // Add further processing logic here
  retrieveDataForCalculation(event.payload.changeId, event.payload.eventId);
});

console.log('Processor is listening for DataPushed events...');