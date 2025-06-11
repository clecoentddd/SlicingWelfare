// src/slices/15_PaymentProcessor/paymentHandler.js
import { domainEventEmitter } from '../shared/eventEmitter';
import { appendEvent } from '../../eventStore/eventRepository';
import { processPaymentCommand } from './processPaymentCommand';

export async function handlePayment(paymentDetails, month) {
  // Create the event using the command
  const paymentEvent = processPaymentCommand(paymentDetails, month);

  // Append the event to the event store
  await appendEvent(paymentEvent);

  // Publish the domain event
  domainEventEmitter.publish('PaymentProcessed', paymentEvent);

  return paymentEvent;
}
