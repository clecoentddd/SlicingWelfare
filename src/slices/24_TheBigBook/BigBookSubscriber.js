import { domainEventEmitter } from '../shared/eventEmitter.js';
import { recordEntry } from './BigBookProjectionHelpers';

// --- PURE EVENT HANDLERS ---

export async function handleDecisionValidatedWithPayments(event) {
  for (const calc of event.payload.calculations) {
    await recordEntry('ToBePaid', calc.netAmount, event.decisionId, calc.month);
  }
}

export async function handleDecisionCalculationValidatedWithExistingPaymentPlan(event) {
  for (const calc of event.payload.calculations) {
    await recordEntry('ToBePaid', calc.netAmount, event.decisionId, calc.month);
  }
}

export async function handleTransactionProcessed(event) {
  const { amount, month } = event.payload;
  await recordEntry('Processed', amount, event.paymentId, month); // Use amount, not -amount
}

// --- SUBSCRIBE FUNCTION ---

export function subscribeBigBook() {
  console.log('[BigBook] Setting up browser subscribers...');

  domainEventEmitter.subscribe('DecisionValidatedWithPayments', handleDecisionValidatedWithPayments);
  domainEventEmitter.subscribe('DecisionCalculationValidatedWithExistingPaymentPlan', handleDecisionCalculationValidatedWithExistingPaymentPlan);
  domainEventEmitter.subscribe('TransactionProcessed', handleTransactionProcessed);

  console.log('[BigBook] Browser subscribers set up.');
}