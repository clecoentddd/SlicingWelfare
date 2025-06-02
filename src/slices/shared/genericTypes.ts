// src/slices/shared/genericTypes.ts
// ───────────────────────────────────
// Every domain event carries its data inside a `payload` object.
// That keeps the wire-format consistent and avoids future breakage.

export interface BaseEvent<T extends string, P> {
  type: T;
  timestamp: number;
  payload: P;
}

/* ────────────── Change-lifecycle events ────────────── */
export type ChangeCreatedEvent = BaseEvent<
  "ChangeCreated",
  {
    changeId: string;
    status: "Open";
  }
>;

export type ChangeCommittedEvent = BaseEvent<
  "ChangeCommitted",
  {
    changeId: string;
    status: "Committed";
  }
>;

export type ChangePushedEvent = BaseEvent<
  "ChangePushed",
  {
    changeId: string;
    status: "Pushed";
  }
>;

export type ChangePublishedEvent = BaseEvent<
  "ChangePublished",
  {
    changeId: string;
    status: "Published";
  }
>;

export type ChangeCancelledEvent = BaseEvent<
  "ChangeCancelled",
  {
    changeId: string;
    status: "Cancelled";
  }
>;

export type ChangeLifecycleEvent =
  | ChangeCreatedEvent
  | ChangeCommittedEvent
  | ChangePushedEvent
  | ChangePublishedEvent
  | ChangeCancelledEvent;

/* ────────────── Resource-level events ────────────── */
export type IncomeAddedEvent = BaseEvent<
  "IncomeAdded",
  {
    changeId: string; // Resource's unique ID for committed events
    amount: number;
    description: string;
    period: {
      start: Date;
      end: Date;
    };
  }
>;

export type ExpenseAddedEvent = BaseEvent<
  "ExpenseAdded",
  {
    changeId: string; // Resource's unique ID for committed events
    amount: number;
    description: string;
    period: {
      start: Date;
      end: Date;
    };
  }
>;

export type ResourceEvent = IncomeAddedEvent | ExpenseAddedEvent;

/* ────────────── Event union you will import elsewhere ────────────── */
export type StoredEvent = ChangeLifecycleEvent | ResourceEvent;

/**
 * Represents an event retrieved from the database, which includes its unique numeric ID.
 * This should be used for events that have already been stored and retrieved.
 */
// FIX: Use an intersection type ('&') instead of 'extends' for type aliases
export type EventWithId = StoredEvent & {
  id: number; // The database-assigned unique ID for the event
};

/* Back-compat alias (if you were using `Event` elsewhere) */
export type Event = StoredEvent;