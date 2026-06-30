export interface Member {
  id: string;
  name: string;
}

export type GroupMode = 'travel' | 'subscription';

export interface Expense {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  amount: number;
  paidBy: string; // Member.id
  splitAmong: string[]; // Member.id[]
  shares?: Record<string, number>; // Member.id -> specific amount
  isSettlement?: boolean;
}

export interface GroupState {
  id: string;
  name: string;
  currency: string;
  members: Member[];
  expenses: Expense[];
  mode: GroupMode;
}

export interface MemberSummary {
  memberId: string;
  paid: number;
  owed: number;
  net: number;
}

export interface Debt {
  from: string; // Member.id
  to: string; // Member.id
  amount: number;
}

export interface SplitSummary {
  totalSpend: number;
  memberSummaries: Record<string, MemberSummary>; // key is memberId
  settlements: Debt[];
}
