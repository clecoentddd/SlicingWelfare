// src/slices/processorCalculation/processorCalculation.ts
import { eventEmitter } from '../shared/eventEmitter';
import { PushedDomainEvent } from '../shared/domainEvents';
import { retrieveDataForCalculation } from './retrieveDataForCalculation';

console.log('Registering event listener for DataPushed event...');
eventEmitter.on('DataPushed', (event: PushedDomainEvent) => {
  console.log(`Pushed domainEvent received with changeId = ${event.payload.changeId}`);
  // Add further processing logic here
   retrieveDataForCalculation(event.payload.changeId);
});

console.log('Processor is listening for DataPushed events...');
