// Manually trigger the projection rebuild

import { projectDecisionEvents } from './DecisionProjection';

async function rebuildProjection() {
  try {
    await projectDecisionEvents();
    console.log('Projection rebuilt successfully.');
  } catch (error) {
    console.error("Error rebuilding projection:", error);
  }
}

// Call this function whenever you need to manually rebuild the projection
rebuildProjection();
