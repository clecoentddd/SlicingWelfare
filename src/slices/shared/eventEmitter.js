// src/shared/eventEmitter.js

class EventEmitter {
  constructor() {
    this.events = {};
  }

  subscribe(eventName, listener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  publish(eventName, data) {
    const listeners = this.events[eventName];
    if (listeners) {
      listeners.forEach(listener => {
        listener(data);
      });
    }
  }
}

export const integrationEventEmitter = new EventEmitter();
export const domainEventEmitter = new EventEmitter();

console.log('Integration EventEmitter instance created:', integrationEventEmitter);
console.log('Domain EventEmitter instance created:', domainEventEmitter);
