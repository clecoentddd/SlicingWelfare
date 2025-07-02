import { domainEventEmitter } from '../shared/eventEmitter';
import { addEventToDecisionProjection } from './DecisionProjection'; // Import the event handler function

export function subscribeToDomainEventNewDecisionWithPayments() {
  domainEventEmitter.subscribe('DecisionValidatedWithPayments', async (pushedEvent) => {
    try {
      console.log('subscribeToDomainEventNewDecisionWithPayments:', pushedEvent);
      // Add your logic here to handle the DataPushed event
      await addEventToDecisionProjection(pushedEvent);
    } catch (error) {
      console.error('Error handling DataPushed event:', error);
    }
  });
}