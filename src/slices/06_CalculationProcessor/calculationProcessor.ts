// src/slices/processorCalculation/processorCalculation.ts
import { eventEmitter } from '../shared/eventEmitter';
import { PushedDomainEvent } from '../shared/domainEvents';

console.log('Registering event listener for DataPushed event...');
eventEmitter.on('DataPushed', (event: PushedDomainEvent) => {
  console.log(`Pushed domainEvent received with changeId = ${event.payload.changeId}`);
  // Add further processing logic here
});

console.log('Processor is listening for DataPushed events...');
