import { publishDomainEventDecisionApproved } from '../11_DecisionApprovalForPayment/PublishDecisionApproval';
import { validationDecisionCommand } from './validationDecisionCommand';

export async function validationDecisionHandler(calculationId, changeId, month, amount) {
  try {
    console.log(`validationDecisionHandler: Starting decision validation for calculationId: ${calculationId}`);

    // Call the command to validate the decision and create the event
    const storedEvent = await validationDecisionCommand(calculationId, changeId);

    // Publish DecisionApprovedForPaymentReconciliation event
    console.log('validationDecisionHandler: Triggering domain event emission');
    await publishDomainEventDecisionApproved(storedEvent);
    console.log('validationDecisionHandler: Emitted domain event emission');

    return storedEvent;
  } catch (error) {
    console.error("Error in validationDecisionHandler:", error);
    throw error;
  }
}
