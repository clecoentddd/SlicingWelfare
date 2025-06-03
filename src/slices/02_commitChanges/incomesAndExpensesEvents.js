export function createIncomeEvent(changeId, amount, description, start, end) {
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

export function createExpenseEvent(changeId, amount, description, start, end) {
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
