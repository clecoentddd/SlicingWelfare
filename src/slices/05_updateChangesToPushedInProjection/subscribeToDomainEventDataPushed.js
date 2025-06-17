import { domainEventEmitter } from "../shared/eventEmitter";
import { updatedProjectionWithDataPushed } from './updatedProjectionWithDataPushed'

export function subscribeToDomainEventDataPushed() {
  domainEventEmitter.subscribe('DataPushed', async (pushedEvent) => {
    try {
      console.log('Handling DataPushed event:', pushedEvent);
      // Add your logic here to handle the DataPushed event
      await updatedProjectionWithDataPushed(pushedEvent);
    } catch (error) {
      console.error('Error handling DataPushed event:', error);
    }
  });
}