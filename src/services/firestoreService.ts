import { db } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  increment
} from "firebase/firestore";
import { Expense, Merchant, Wallet, Category } from "../types";

export const getFamilyExpenses = (familyId: string, callback: (expenses: Expense[]) => void) => {
  const q = query(
    collection(db, "families", familyId, "expenses"),
    orderBy("date", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
  });
};

export const addExpense = async (expense: Omit<Expense, "id">) => {
  const docRef = await addDoc(collection(db, "families", expense.familyId, "expenses"), {
    ...expense,
    date: Timestamp.now() // Enforce server time
  });
  
  // Update wallet balance - nested path
  const walletQ = query(collection(db, "families", expense.familyId, "wallets"), limit(1));
  const walletSnap = await getDocs(walletQ);
  if (!walletSnap.empty) {
    const walletDoc = walletSnap.docs[0];
    await updateDoc(doc(db, "families", expense.familyId, "wallets", walletDoc.id), {
      balance: increment(-expense.amount)
    });
  }
  
  // Update Merchant stats - nested path
  if (expense.merchantId) {
    await updateDoc(doc(db, "families", expense.familyId, "merchants", expense.merchantId), {
      "stats.totalPurchases": increment(1),
      "stats.totalSpent": increment(expense.amount),
      "stats.lastPurchaseDate": Timestamp.now()
    });
  }

  return docRef.id;
};

export const getWallet = (familyId: string, callback: (wallet: Wallet | null) => void) => {
  const q = query(collection(db, "families", familyId, "wallets"));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) callback(null);
    else callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Wallet);
  });
};

export const getMerchants = async (familyId: string) => {
  const q = query(collection(db, "families", familyId, "merchants"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Merchant));
};
