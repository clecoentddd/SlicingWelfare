// src/slices/shared/genericTypes.ts

export type ChangeCreatedEvent = {
  type: "ChangeCreated";
  timestamp: number;
  payload: {
    changeId: string;
    status: "Open";
  };
};

export type IncomeAddedEvent = {
  type: "IncomeAdded";
  timestamp: number;
  payload: {
    changeId: string;
    amount: number;
    description: string;
    period: {
      start: Date;
      end: Date;
    };
  };
};

export type ExpenseAddedEvent = {
  type: "ExpenseAdded";
  timestamp: number;
  payload: {
    changeId: string;
    amount: number;
    description: string;
    period: {
      start: Date;
      end: Date;
    };
  };
};

export type ResourceEvent = IncomeAddedEvent | ExpenseAddedEvent;

export type StoredEvent = ChangeCreatedEvent | ResourceEvent;
