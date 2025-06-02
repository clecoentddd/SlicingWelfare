// src/slices/shared/domainEvents.ts

export interface PushedDomainEvent {
  type: "DataPushed";
  timestamp: number;
  payload: {
    changeId: string;
    eventId: number;
  };
}
