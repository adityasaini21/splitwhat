import type { GroupState, SplitSummary, MemberSummary, Debt } from './types';

export function calculateSplit(state: GroupState): SplitSummary {
  const memberIds = new Set(state.members.map((m) => m.id));
  
  // Initialize summaries for all active members
  const memberSummaries: Record<string, MemberSummary> = {};
  for (const member of state.members) {
    memberSummaries[member.id] = {
      memberId: member.id,
      paid: 0,
      owed: 0,
      net: 0,
    };
  }

  let totalSpend = 0;

  // Process all expenses
  for (const expense of state.expenses) {
    const amount = expense.amount;
    if (isNaN(amount) || amount <= 0) continue;

    // Filter to ensure split targets exist in active members
    const activeSplitAmong = expense.splitAmong.filter((id) => memberIds.has(id));
    const paidByExists = memberIds.has(expense.paidBy);

    if (activeSplitAmong.length === 0 || !paidByExists) {
      continue;
    }

    totalSpend += amount;

    // Credit the payer
    memberSummaries[expense.paidBy].paid += amount;

    // Debit the split targets
    const share = amount / activeSplitAmong.length;
    for (const targetId of activeSplitAmong) {
      memberSummaries[targetId].owed += share;
    }
  }

  // Calculate net balances (paid - owed)
  for (const memberId of memberIds) {
    const summary = memberSummaries[memberId];
    summary.net = summary.paid - summary.owed;
  }

  // Generate minimal settlements
  const settlements: Debt[] = [];
  
  // Clone net balances for settlement computation
  const balances = state.members.map((m) => ({
    id: m.id,
    net: memberSummaries[m.id].net,
  }));

  const EPSILON = 0.01;

  while (true) {
    // Separate debtors and creditors
    const debtors = balances
      .filter((b) => b.net < -EPSILON)
      .sort((a, b) => a.net - b.net); // Most negative first
    
    const creditors = balances
      .filter((b) => b.net > EPSILON)
      .sort((a, b) => b.net - a.net); // Most positive first

    if (debtors.length === 0 || creditors.length === 0) {
      break;
    }

    const debtor = debtors[0];
    const creditor = creditors[0];

    const amount = Math.min(-debtor.net, creditor.net);
    
    settlements.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount * 100) / 100,
    });

    // Update balances
    debtor.net += amount;
    creditor.net -= amount;
  }

  // Round summary numbers to 2 decimal places
  for (const memberId of memberIds) {
    const s = memberSummaries[memberId];
    s.paid = Math.round(s.paid * 100) / 100;
    s.owed = Math.round(s.owed * 100) / 100;
    s.net = Math.round(s.net * 100) / 100;
  }

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    memberSummaries,
    settlements,
  };
}
