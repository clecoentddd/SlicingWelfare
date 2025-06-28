import { domainEventEmitter } from '../shared/eventEmitter';
import { handleProcessedEventForProjection } from './eventHandlerProjection'; // Import the event handler function

export function subscribeToTransactionProcessed() {
  console.log ("subscribeToTransactionProcessed - domainEventEmitter.subscribe"); 
  domainEventEmitter.subscribe('TransactionProcessed', handleProcessedEventForProjection);
}