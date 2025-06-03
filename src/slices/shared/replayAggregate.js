// src/shared/replayAggregate.js

// IMPORTANT: Update this import to point to your new centralized eventRepository.js
// From src/shared/ to src/eventStore/eventRepository.js is ../eventStore/eventRepository.js
import { getEventsByChangeId } from '../../eventStore/eventRepository'; 

// Update this import to point to your converted getStatus.js
// From src/shared/ to src/slices/shared/getStatus.js is ../slices/shared/getStatus.js
import { getChangeStatus } from '../shared/getStatus';

// EventWithId and AggregateState were TypeScript types, so their imports and definitions are removed.
// import { EventWithId } from './genericTypes';

/**
 * Replays events for a given changeId to reconstruct its aggregate state.
 * This function is responsible for fetching the necessary events from the EventDB.
 *
 * @param {string} changeId The ID of the change for which to reconstruct the state.
 * @returns {Promise<{status: string}>} A promise that resolves with the current aggregate state (e.g., { status: 'Open' }).
 */
export async function replayAggregate(
    changeId // Removed type annotation
) { // Removed Promise<AggregateState> type annotation
    console.log(`Replaying aggregate for changeId: ${changeId}`);

    // Fetch all events for this specific changeId from the EventDB
    const committedEvents = await getEventsByChangeId(changeId);

    // Pass the fetched events to getChangeStatus to determine the aggregate's status.
    const status = getChangeStatus(committedEvents, changeId);

    console.log(`Replay complete for ${changeId}. Status: ${status}`);
    return { status }; // Return the reconstructed state
}