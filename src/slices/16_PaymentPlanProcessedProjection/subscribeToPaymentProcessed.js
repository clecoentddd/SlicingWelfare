import { domainEventEmitter } from '../shared/eventEmitter';
import { handleProcessedEventForProjection } from './eventHandlerProjection'; // Import the event handler function

export function subscribeToPaymentProcessed() {
  domainEventEmitter.subscribe('PaymentProcessed', handleProcessedEventForProjection);
}