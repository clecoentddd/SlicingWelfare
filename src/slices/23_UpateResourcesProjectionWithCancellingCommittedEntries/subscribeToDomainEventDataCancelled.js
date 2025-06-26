import { domainEventEmitter } from "../shared/eventEmitter";
import { updatedProjectionWithDataCancelled } from './updatedProjectionWithDataCancelled'

export function subscribeToDomainEventDataCancelled() {
  domainEventEmitter.subscribe('DataCancelled', async (cancelledEvent) => {
    try {
      console.log('Handling Datacancelled event:', cancelledEvent);
      // Add your logic here to handle the DataPushed event
      await updatedProjectionWithDataCancelled(cancelledEvent);
    } catch (error) {
      console.error('Error handling Datacancelled event:', error);
    }
  });
}