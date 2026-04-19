import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { Expense, Wallet } from "../types";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { FileText, Share2, TrendingUp, ChevronDown } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function Reports() {
  const { family } = useAuth();
  const [activeTab, setActiveTab] = useState("MONTHLY");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (!family?.id) return;
    
    // Fetch Wallet
    const fetchWallet = async () => {
      const q = query(collection(db, "wallets"), where("familyId", "==", family.id));
      const snap = await getDocs(q);
      if (!snap.empty) setWallet({ id: snap.docs[0].id, ...snap.docs[0].data() } as Wallet);
    };
    fetchWallet();

    // Fetch Expenses
    const fetchExpenses = async () => {
      const q = query(
        collection(db, "expenses"),
        where("familyId", "==", family.id),
        orderBy("date", "desc")
      );
      const snap = await getDocs(q);
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
    };
    fetchExpenses();
  }, [family]);

  const categoryTotals = expenses.reduce((acc: any, curr) => {
    acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
    return acc;
  }, {});

  const pieData = Object.keys(categoryTotals).map(catId => ({
    name: catId === "cat1" ? "طعام" : catId === "cat2" ? "مقاضي" : "أخرى",
    value: categoryTotals[catId]
  }));

  const COLORS = ["#006a6a", "#8dedec", "#ffdcc3", "#98fabe"];

  const generatePDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("helvetica", "bold");
    doc.text("Report - Al Ezbah", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Family: ${family?.name}`, 20, 30);
    doc.text(`Total Spent: ${expenses.reduce((a, b) => a + b.amount, 0)} SAR`, 20, 40);

    const tableData = expenses.map(e => [
      new Date(e.date.seconds * 1000).toLocaleDateString(),
      e.amount.toString(),
      e.subItem || "N/A"
    ]);

    (doc as any).autoTable({
      head: [["Date", "Amount (SAR)", "Item"]],
      body: tableData,
      startY: 50
    });

    doc.save(`ezbah-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const totalSpent = expenses.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="px-6 space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="pt-8 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black font-headline mb-2">التقارير</h2>
          <p className="text-on-surface-variant">تحليل شامل لنفقات العائلة</p>
        </div>
        <div className="flex gap-2">
            <button className="p-3 bg-surface-container-low rounded-2xl text-primary"><Share2 size={20} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-surface-container-low rounded-2xl mb-8">
        {["DAILY", "WEEKLY", "MONTHLY"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-center rounded-xl font-bold transition-all",
              activeTab === tab ? "bg-surface-container-lowest text-primary shadow-sm scale-[1.02]" : "text-on-surface-variant"
            )}
          >
            {tab === "DAILY" ? "يومي" : tab === "WEEKLY" ? "أسبوعي" : "شهري"}
          </button>
        ))}
      </div>

      {/* Total Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dim rounded-3xl p-10 text-white editorial-shadow">
        <div className="relative z-10 flex flex-col items-center">
          <p className="text-white/70 text-sm font-medium mb-2">إجمالي المصاريف هذا الشهر</p>
          <div className="flex items-baseline gap-2">
             <h2 className="text-5xl font-extrabold tracking-tight">{totalSpent.toLocaleString()}</h2>
             <span className="text-xl opacity-60">ر.س</span>
          </div>
          <div className="flex items-center gap-2 mt-6 bg-white/10 px-4 py-2 rounded-full text-xs font-bold ring-1 ring-white/20">
            <TrendingUp size={16} />
            <span>12% أكثر من الشهر الماضي</span>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Analytics Chart */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold font-headline">توزيع المصاريف</h3>
        <div className="bg-surface-container-low h-64 rounded-3xl flex items-center justify-center p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData.length > 0 ? pieData : [{ name: "لا توجد بيانات", value: 1 }]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Top Items Table-style */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-bold font-headline">الأكثر طلباً</h3>
          <span className="text-primary text-sm font-bold">عرض الكل</span>
        </div>
        <div className="bg-surface-container-lowest rounded-3xl divide-y divide-outline-variant/10 overflow-hidden border border-outline-variant/10 editorial-shadow">
          {expenses.slice(0, 3).map((exp, i) => (
            <div key={i} className="p-5 flex items-center justify-between hover:bg-surface-container-low transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container overflow-hidden">
                  <img src={`https://picsum.photos/seed/${exp.subItem}/100/100`} alt="item" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-sm">{exp.subItem}</p>
                  <p className="text-xs text-on-surface-variant mt-1">عدد المرات: ٥</p>
                </div>
              </div>
              <p className="font-black text-primary">{exp.amount} <small className="text-[10px]">ر.س</small></p>
            </div>
          ))}
        </div>
      </section>

      {/* Export Action */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={generatePDF}
          className="bg-surface-container-high text-on-surface font-bold py-5 px-6 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <FileText size={20} />
          تصدير PDF
        </button>
        <button className="bg-gradient-to-r from-primary to-primary-dim text-white font-bold py-5 px-6 rounded-3xl flex items-center justify-center gap-3 editorial-shadow active:scale-95 transition-all">
          <Share2 size={20} />
          مشاركة
        </button>
      </div>
    </div>
  );
}
