import { db } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return Timestamp.fromDate(d);
};

export const seedSampleData = async (familyId: string, _userId: string) => {
  try {
    // 1. Wallet — 8000 SAR budget, salary on the 27th
    await addDoc(collection(db, "families", familyId, "wallets"), {
      familyId,
      monthlyBudget: 8000,
      balance: 8000,
      salaryDay: 27,
      currentMonth: "",
      categoryBudgets: {
        food: 2000,
        groceries: 1500,
        utilities: 800,
        transport: 700,
        education: 600,
        health: 400,
        occasions: 300,
        entertainment: 500,
        clothing: 400,
      },
    });

    // 2. Saudi-appropriate categories
    const categories = [
      { id: "food",          name: "طعام ومشروبات",    icon: "Utensils",       subItems: ["لحوم","دجاج","أسماك","خضروات","فواكه","مشروبات","حلويات"] },
      { id: "groceries",     name: "مقاضي وبقالة",     icon: "ShoppingCart",   subItems: ["ألبان وأجبان","خبز ومعجنات","بقوليات","زيوت وتوابل","معلبات","أرز وحبوب"] },
      { id: "utilities",     name: "فواتير ومرافق",    icon: "Zap",            subItems: ["كهرباء","ماء","إنترنت","جوال","تلفزيون"] },
      { id: "transport",     name: "مواصلات",          icon: "Car",            subItems: ["بنزين","غسيل سيارة","صيانة","تاكسي/أوبر"] },
      { id: "education",     name: "تعليم",            icon: "GraduationCap",  subItems: ["رسوم مدرسة","كتب ومستلزمات","دروس خصوصية","أنشطة"] },
      { id: "health",        name: "صحة",              icon: "Heart",          subItems: ["أدوية","طبيب","مستشفى","صيدلية"] },
      { id: "occasions",     name: "مناسبات",          icon: "Gift",           subItems: ["أفراح","عزاء","هدايا","ضيافة"] },
      { id: "entertainment", name: "ترفيه ومطاعم",     icon: "Film",           subItems: ["مطاعم","مقاهي","سينما","رحلات"] },
      { id: "clothing",      name: "ملابس",            icon: "Shirt",          subItems: ["ملابس رجالية","ملابس نسائية","ملابس أطفال","أحذية"] },
    ];

    for (const cat of categories) {
      await addDoc(collection(db, "families", familyId, "categories"), { ...cat, familyId });
    }

    // 3. Saudi merchants
    const merchants = [
      { name: "بنده",               categoryId: "groceries" },
      { name: "كارفور",              categoryId: "groceries" },
      { name: "أسواق العثيم",        categoryId: "groceries" },
      { name: "لولو هايبرماركت",     categoryId: "groceries" },
      { name: "الدانوب",             categoryId: "groceries" },
      { name: "مطعم البيك",          categoryId: "entertainment" },
      { name: "ستاربكس",             categoryId: "entertainment" },
      { name: "محطة أرامكو",         categoryId: "transport" },
    ];

    for (const m of merchants) {
      await addDoc(collection(db, "families", familyId, "merchants"), {
        ...m, familyId, createdAt: Timestamp.now(),
        stats: { totalPurchases: 0, totalSpent: 0, lastPurchaseDate: Timestamp.now() },
      });
    }

    // 4. Sample expenses spread across the current cycle
    const expenses = [
      { categoryId: "groceries",     subItem: "ألبان وأجبان",  amount: 65,  date: daysAgo(1)  },
      { categoryId: "food",          subItem: "دجاج",           amount: 120, date: daysAgo(2)  },
      { categoryId: "transport",     subItem: "بنزين",          amount: 180, date: daysAgo(3)  },
      { categoryId: "groceries",     subItem: "خضروات",         amount: 55,  date: daysAgo(4)  },
      { categoryId: "entertainment", subItem: "مطاعم",          amount: 220, date: daysAgo(5)  },
      { categoryId: "health",        subItem: "أدوية",          amount: 85,  date: daysAgo(6)  },
      { categoryId: "groceries",     subItem: "أرز وحبوب",      amount: 90,  date: daysAgo(7)  },
      { categoryId: "utilities",     subItem: "جوال",           amount: 150, date: daysAgo(8)  },
      { categoryId: "food",          subItem: "لحوم",           amount: 250, date: daysAgo(9)  },
      { categoryId: "education",     subItem: "كتب ومستلزمات", amount: 130, date: daysAgo(10) },
    ];

    for (const exp of expenses) {
      await addDoc(collection(db, "families", familyId, "expenses"), { ...exp, familyId, merchantId: "" });
    }

    // 5. Shopping items
    const shoppingItems = [
      { name: "حليب عضوي",    listType: "DAILY",   category: "groceries", quantity: 2,  estimatedPrice: 24,  priority: "HIGH",   completed: false, suggested: true  },
      { name: "خبز صامولي",   listType: "DAILY",   category: "groceries", quantity: 6,  estimatedPrice: 10,  priority: "MEDIUM", completed: false, suggested: true  },
      { name: "مياه معدنية",   listType: "WEEKLY",  category: "groceries", quantity: 1,  estimatedPrice: 25,  priority: "HIGH",   completed: false, suggested: false },
      { name: "زيت زيتون",    listType: "WEEKLY",  category: "groceries", quantity: 1,  estimatedPrice: 45,  priority: "LOW",    completed: false, suggested: false },
      { name: "أرز",          listType: "MONTHLY", category: "groceries", quantity: 2,  estimatedPrice: 60,  priority: "HIGH",   completed: false, suggested: false },
      { name: "سكر",          listType: "MONTHLY", category: "groceries", quantity: 2,  estimatedPrice: 30,  priority: "MEDIUM", completed: false, suggested: false },
    ];

    for (const item of shoppingItems) {
      await addDoc(collection(db, "families", familyId, "shoppingItems"), {
        ...item, familyId, createdAt: Timestamp.now(),
      });
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seeding failed", error);
    throw error;
  }
};
