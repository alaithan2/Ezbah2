export type ShoppingListType = "DAILY" | "WEEKLY" | "MONTHLY";
export type WalletTransactionType = "RECHARGE" | "EXPENSE" | "ADJUSTMENT";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  familyId?: string;
  photoURL?: string;
}

export interface Family {
  id: string;
  name: string;
  createdBy: string;
  createdAt: any;
  members: string[];
}

export interface Wallet {
  id: string;
  familyId: string;
  monthlyBudget: number;
  balance: number;
  currentMonth: string; // e.g., "2024-06"
}

export interface Category {
  id: string;
  familyId: string;
  name: string;
  icon: string;
  subItems: string[];
}

export interface Merchant {
  id: string;
  familyId: string;
  name: string;
  phone?: string;
  categoryId?: string;
  notes?: string;
  createdAt: any;
  stats?: {
    totalPurchases: number;
    totalSpent: number;
    lastPurchaseDate: any;
  };
}

export interface Expense {
  id: string;
  familyId: string;
  categoryId: string;
  subItem: string;
  amount: number;
  merchantId: string;
  date: any;
  notes?: string;
}

export interface ShoppingListItem {
  id: string;
  listType: ShoppingListType;
  name: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
  priority: PriorityLevel;
  suggested: boolean;
  completed: boolean;
  createdAt: any;
}
