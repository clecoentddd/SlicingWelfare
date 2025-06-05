// src/slices/06_CalculationProcessor/SubscribeResourcesPushed.js

import { eventEmitter } from '../shared/eventEmitter';
import { retrieveDataForCalculation } from './retrieveDataForCalculation';

export function subscribeToResourcesPushed() {
  const handleDataPushed = (event) => {
    if (event.metadata && event.metadata.domainEvent) {
      console.log(`DataPushed domain event received with changeId = ${event.payload.changeId}`);
      retrieveDataForCalculation(event.payload.changeId, event.payload.eventId);
    }
  };

  eventEmitter.on('DataPushed', handleDataPushed);
  console.log('Subscribed to DataPushed domain events.');
}
