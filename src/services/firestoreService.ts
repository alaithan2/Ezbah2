import { db } from "../lib/firebase";
import {
  collection, query, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, limit, onSnapshot, Timestamp, increment
} from "firebase/firestore";
import { Expense, Merchant, Wallet, Category, ShoppingListItem } from "../types";

export const getFamilyExpenses = (familyId: string, callback: (expenses: Expense[]) => void) => {
  const q = query(
    collection(db, "families", familyId, "expenses"),
    orderBy("date", "desc"),
    limit(300)
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
  });
};

export const addExpense = async (expense: Omit<Expense, "id">) => {
  const docRef = await addDoc(collection(db, "families", expense.familyId, "expenses"), {
    ...expense,
    date: Timestamp.now(),
  });

  if (expense.merchantId) {
    updateDoc(doc(db, "families", expense.familyId, "merchants", expense.merchantId), {
      "stats.totalPurchases": increment(1),
      "stats.totalSpent": increment(expense.amount),
      "stats.lastPurchaseDate": Timestamp.now(),
    }).catch(() => {});
  }

  return docRef.id;
};

export const deleteExpense = async (familyId: string, expenseId: string) => {
  await deleteDoc(doc(db, "families", familyId, "expenses", expenseId));
};

export const getWallet = (familyId: string, callback: (wallet: Wallet | null) => void) => {
  const q = query(collection(db, "families", familyId, "wallets"));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) callback(null);
    else callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Wallet);
  });
};

export const updateWalletSettings = async (
  familyId: string,
  walletId: string,
  updates: Partial<Pick<Wallet, "monthlyBudget" | "salaryDay" | "categoryBudgets">>
) => {
  await updateDoc(doc(db, "families", familyId, "wallets", walletId), updates as any);
};

export const getCategories = async (familyId: string): Promise<Category[]> => {
  const snap = await getDocs(collection(db, "families", familyId, "categories"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
};

export const getMerchants = async (familyId: string): Promise<Merchant[]> => {
  const snap = await getDocs(collection(db, "families", familyId, "merchants"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Merchant));
};

export const createMerchant = async (familyId: string, name: string): Promise<Merchant> => {
  const ref = await addDoc(collection(db, "families", familyId, "merchants"), {
    familyId,
    name,
    createdAt: Timestamp.now(),
    stats: { totalPurchases: 0, totalSpent: 0, lastPurchaseDate: Timestamp.now() },
  });
  return {
    id: ref.id, familyId, name, createdAt: Timestamp.now(),
    stats: { totalPurchases: 0, totalSpent: 0, lastPurchaseDate: Timestamp.now() },
  };
};

export const addShoppingItem = async (
  familyId: string,
  item: Omit<ShoppingListItem, "id" | "createdAt">
) => {
  return addDoc(collection(db, "families", familyId, "shoppingItems"), {
    ...item,
    createdAt: Timestamp.now(),
  });
};

export const deleteShoppingItem = async (familyId: string, itemId: string) => {
  await deleteDoc(doc(db, "families", familyId, "shoppingItems", itemId));
};

export const createCategory = async (familyId: string, cat: Omit<Category, "id">) => {
  const ref = await addDoc(collection(db, "families", familyId, "categories"), cat);
  return ref.id;
};

export const updateCategory = async (familyId: string, categoryId: string, updates: Partial<Category>) => {
  await updateDoc(doc(db, "families", familyId, "categories", categoryId), updates as any);
};

export const deleteCategory = async (familyId: string, categoryId: string) => {
  await deleteDoc(doc(db, "families", familyId, "categories", categoryId));
};

export const deleteMerchant = async (familyId: string, merchantId: string) => {
  await deleteDoc(doc(db, "families", familyId, "merchants", merchantId));
};

export const updateMerchant = async (familyId: string, merchantId: string, name: string) => {
  await updateDoc(doc(db, "families", familyId, "merchants", merchantId), { name });
};
