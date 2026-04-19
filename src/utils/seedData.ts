import { db, auth } from "../lib/firebase";
import { collection, addDoc, Timestamp, setDoc, doc } from "firebase/firestore";

export const seedSampleData = async (familyId: string, userId: string) => {
  try {
    // 1. Create Wallet
    await addDoc(collection(db, "families", familyId, "wallets"), {
      familyId,
      monthlyBudget: 5400,
      balance: 2300,
      currentMonth: "2024-06"
    });

    // 2. Create Categories
    const categories = [
      { name: "طعام", icon: "Utensils", subItems: ["Meat", "Chicken", "Fish"] },
      { name: "مقاضي", icon: "ShoppingCart", subItems: ["Vegetables", "Fruits", "Dairy"] },
      { name: "المنزل", icon: "Home", subItems: ["Cleaning", "Maintenance"] },
      { name: "نقل", icon: "Car", subItems: ["Fuel", "Service"] }
    ];

    for (const cat of categories) {
      await addDoc(collection(db, "families", familyId, "categories"), { ...cat, familyId });
    }

    // 3. Create Merchants
    const merchants = [
      { name: "بندة", stats: { totalPurchases: 12, totalSpent: 2400, lastPurchaseDate: Timestamp.now() } },
      { name: "التميمي", stats: { totalPurchases: 5, totalSpent: 1200, lastPurchaseDate: Timestamp.now() } },
      { name: "أسواق العثيم", stats: { totalPurchases: 20, totalSpent: 4500, lastPurchaseDate: Timestamp.now() } }
    ];

    for (const m of merchants) {
      await addDoc(collection(db, "families", familyId, "merchants"), { ...m, familyId, createdAt: Timestamp.now() });
    }

    // 4. Create Sample Expenses
    const expenses = [
      { categoryId: "cat1", subItem: "Meat", amount: 120, date: Timestamp.now() },
      { categoryId: "cat2", subItem: "Dairy", amount: 45, date: Timestamp.now() },
      { categoryId: "cat1", subItem: "Fish", amount: 80, date: Timestamp.now() }
    ];

    for (const exp of expenses) {
      await addDoc(collection(db, "families", familyId, "expenses"), { ...exp, familyId });
    }

    // 5. Create Shopping Items
    const shoppingItems = [
      { name: "حليب عضوي", listType: "DAILY", category: "Dairy", quantity: 2, estimatedPrice: 24, priority: "HIGH", completed: false, suggested: true },
      { name: "خبز صامولي", listType: "DAILY", category: "Bakery", quantity: 6, estimatedPrice: 5, priority: "MEDIUM", completed: false, suggested: true },
      { name: "زيت زيتون", listType: "WEEKLY", category: "Pantry", quantity: 1, estimatedPrice: 45, priority: "LOW", completed: false, suggested: false }
    ];

    for (const item of shoppingItems) {
      await addDoc(collection(db, "families", familyId, "shoppingItems"), { ...item, familyId, createdAt: Timestamp.now() });
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding failed", error);
  }
};
