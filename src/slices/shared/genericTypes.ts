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
    changeId: string;
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
    changeId: string;
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

/* Back-compat alias (if you were using `Event` elsewhere) */
export type Event = StoredEvent;
