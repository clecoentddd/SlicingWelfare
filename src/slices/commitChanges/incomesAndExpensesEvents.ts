import { ResourceEvent } from "../shared/genericTypes";

export function createIncomeEvent(
  changeId: string,
  amount: number,
  description: string,
  start: string,
  end: string
): ResourceEvent {
  return {
    type: "IncomeAdded",
    timestamp: Date.now(),
    payload: {
      changeId,
      amount,
      description,
      period: {
        start: new Date(start + "-01"),
        end: new Date(end + "-01"),
      },
    },
  };
}

export function createExpenseEvent(
  changeId: string,
  amount: number,
  description: string,
  start: string,
  end: string
): ResourceEvent {
  return {
    type: "ExpenseAdded",
    timestamp: Date.now(),
    payload: {
      changeId,
      amount,
      description,
      period: {
        start: new Date(start + "-01"),
        end: new Date(end + "-01"),
      },
    },
  };
}
