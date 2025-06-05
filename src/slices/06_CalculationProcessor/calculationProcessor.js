// src/slices/processorCalculation/processorCalculation.js

import { eventEmitter } from '../shared/eventEmitter.js';
import { retrieveDataForCalculation } from './retrieveDataForCalculation.js';

console.log('Registering event listener for DataPushed event...');

eventEmitter.on('DataPushed', (event) => {
  if (event.metadata && event.metadata.domainEvent) {
    console.log(`DataPushed domain event received with changeId = ${event.payload.changeId}`);
    // Add further processing logic here
    retrieveDataForCalculation(event.payload.changeId, event.payload.eventId);
  }
});

console.log('Processor is listening for DataPushed domain events...');
