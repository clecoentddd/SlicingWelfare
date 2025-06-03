// src/shared/eventEmitter.js
import { EventEmitter } from 'events';

export const eventEmitter = new EventEmitter();
console.log('EventEmitter instance created:', eventEmitter);