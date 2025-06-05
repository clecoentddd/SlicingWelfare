export function createIncomeEvent(changeId, amount, description, start, end) {
  return {
    type: "IncomeAdded",
    changeId: changeId,
    aggregate: "Resource",
    timestamp: Date.now(),
    payload: {
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
    changeId: changeId,
    aggregate: "Resource",
    timestamp: Date.now(),
    payload: {
      amount,
      description,
      period: {
        start: new Date(start + "-01"),
        end: new Date(end + "-01"),
      },
    },
  };
}
