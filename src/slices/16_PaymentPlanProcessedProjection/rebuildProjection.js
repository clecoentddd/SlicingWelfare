import { clearPaymentPlansDB } from '../shared/openPaymentPlanDB';
import { handleProcessedEventForProjection } from './eventHandlerProjection'; // Import the event handler function
import { getAllEvents } from '../../eventStore/eventRepository'; // Import the function to fetch events
import { handleToBeProcessedEventForProjection } from '../14_PaymentPlanProjection/PaymentPlanToBeProcessedProjection.js';

export const rebuildProjection = async () => {
  console.log('Starting to rebuild projection...');

  const success = await clearPaymentPlansDB();
  if (!success) {
    console.error('Failed to clear the database.');
    return;
  }

  console.log('Database cleared. Fetching events from EventDB...');

  try {
    const events = await getAllEvents();
    console.log('Fetched events:', events);

    // Filter events to include only those of type "PaymentPlanPrepared" or "PaymentProcessed" and sort them by ID
    const filteredEvents = events
      .filter(event => ['PaymentPlanPrepared', 'PaymentPlanPreparedInReplacement', 'PaymentProcessed'].includes(event.type))
      .sort((a, b) => a.id - b.id); // Sort by ID in ascending order

    console.log('Filtered and sorted events:', filteredEvents);

    console.log('Replaying filtered events in order...');

    // Process each event in order
    for (const event of filteredEvents) {
      try {
        if (event.type === 'PaymentPlanPrepared' || event.type === 'PaymentPlanPreparedInReplacement') {
          await handleToBeProcessedEventForProjection(event);
        } else if (event.type === 'PaymentProcessed') {
          await handleProcessedEventForProjection(event);
        }
        console.log(`Processed event ${event}`);
      } catch (error) {
        console.error(`Failed to process event ${event}:`, error);
      }
    }

    console.log('Projection rebuilt successfully.');
  } catch (error) {
    console.error('Failed to fetch or process events:', error);
  }
};
