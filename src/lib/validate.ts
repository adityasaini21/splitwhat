import type { GroupState, Member, Expense } from './types';

export const LIMITS = {
  MAX_MEMBERS: 30,
  MAX_EXPENSES: 300,
  MAX_NAME_LENGTH: 50,
  MAX_EXPENSE_TITLE_LENGTH: 100,
};

export function validateMemberName(name: string, existingMembers: Member[]): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Name cannot be empty';
  }
  if (trimmed.length > LIMITS.MAX_NAME_LENGTH) {
    return `Name cannot exceed ${LIMITS.MAX_NAME_LENGTH} characters`;
  }
  if (existingMembers.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
    return 'A member with this name already exists';
  }
  if (existingMembers.length >= LIMITS.MAX_MEMBERS) {
    return `Group cannot exceed ${LIMITS.MAX_MEMBERS} members`;
  }
  return null;
}

export interface ExpenseValidationError {
  title?: string;
  amount?: string;
  paidBy?: string;
  splitAmong?: string;
  general?: string;
}

export function validateExpenseData(
  title: string,
  amount: number,
  paidBy: string,
  splitAmong: string[],
  currentExpensesCount: number
): ExpenseValidationError | null {
  const errors: ExpenseValidationError = {};

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    errors.title = 'Title is required';
  } else if (trimmedTitle.length > LIMITS.MAX_EXPENSE_TITLE_LENGTH) {
    errors.title = `Title cannot exceed ${LIMITS.MAX_EXPENSE_TITLE_LENGTH} characters`;
  }

  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than zero';
  }

  if (!paidBy) {
    errors.paidBy = 'Select who paid';
  }

  if (!splitAmong || splitAmong.length === 0) {
    errors.splitAmong = 'Select at least one member to split with';
  }

  if (currentExpensesCount >= LIMITS.MAX_EXPENSES) {
    errors.general = `Group cannot exceed ${LIMITS.MAX_EXPENSES} expenses`;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function sanitizeGroupState(state: any): GroupState | null {
  if (!state || typeof state !== 'object') return null;

  try {
    const id = typeof state.id === 'string' ? state.id : Math.random().toString(36).substring(2, 9);
    const name = typeof state.name === 'string' ? state.name.trim().substring(0, 100) : 'Split';
    const currency = typeof state.currency === 'string' ? state.currency.trim().substring(0, 10) : 'USD';
    const mode = state.mode === 'travel' || state.mode === 'subscription' ? state.mode : 'travel';

    const members: Member[] = [];
    if (Array.isArray(state.members)) {
      const seenIds = new Set<string>();
      for (const m of state.members) {
        if (m && typeof m === 'object' && typeof m.id === 'string' && typeof m.name === 'string') {
          const mId = m.id.trim();
          const mName = m.name.trim();
          if (mId && mName && !seenIds.has(mId) && members.length < LIMITS.MAX_MEMBERS) {
            seenIds.add(mId);
            members.push({ id: mId, name: mName.substring(0, LIMITS.MAX_NAME_LENGTH) });
          }
        }
      }
    }

    const expenses: Expense[] = [];
    if (Array.isArray(state.expenses)) {
      for (const e of state.expenses) {
        if (
          e &&
          typeof e === 'object' &&
          typeof e.id === 'string' &&
          typeof e.title === 'string' &&
          typeof e.amount === 'number' &&
          typeof e.paidBy === 'string' &&
          Array.isArray(e.splitAmong)
        ) {
          const memberIds = new Set(members.map((m) => m.id));
          const cleanSplitAmong = e.splitAmong.filter((id: any) => typeof id === 'string' && memberIds.has(id));

          if (
            memberIds.has(e.paidBy) &&
            cleanSplitAmong.length > 0 &&
            e.amount > 0 &&
            expenses.length < LIMITS.MAX_EXPENSES
          ) {
             let cleanShares: Record<string, number> | undefined = undefined;
             if (e.shares && typeof e.shares === 'object') {
               cleanShares = {};
               for (const [key, val] of Object.entries(e.shares)) {
                 if (typeof val === 'number' && !isNaN(val)) {
                   cleanShares[key] = Math.round(val * 100) / 100;
                 }
               }
             }

             expenses.push({
               id: e.id,
               title: e.title.trim().substring(0, LIMITS.MAX_EXPENSE_TITLE_LENGTH),
               category: typeof e.category === 'string' ? e.category : 'other',
               subCategory: typeof e.subCategory === 'string' ? e.subCategory : undefined,
               amount: Math.round(e.amount * 100) / 100,
               paidBy: e.paidBy,
               splitAmong: cleanSplitAmong,
               shares: cleanShares,
               isSettlement: typeof e.isSettlement === 'boolean' ? e.isSettlement : undefined,
             });
          }
        }
      }
    }

    return {
      id,
      name,
      currency,
      members,
      expenses,
      mode,
    };
  } catch (err) {
    console.error('Failed sanitizing GroupState:', err);
    return null;
  }
}
