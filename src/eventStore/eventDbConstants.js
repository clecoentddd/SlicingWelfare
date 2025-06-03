// src/eventStore/eventDbConstants.js

/**
 * @file This file contains constants related to the Event IndexedDB.
 */

/**
 * The name of the IndexedDB database for events.
 * @type {string}
 */
export const DB_NAME = "EventDB";

/**
 * The name of the object store within the EventDB for storing events.
 * @type {string}
 */
export const EVENT_STORE_NAME = "events";

/**
 * The current version of the EventDB schema.
 * Increment this number when you make changes to the database schema (e.g., adding/removing object stores, adding/removing indices).
 * @type {number}
 */
export const DB_VERSION = 3 // Start with 1, increment if schema changes