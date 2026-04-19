import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { TopBar } from "./components/layout/TopBar";
import { BottomNav } from "./components/layout/BottomNav";
import { motion, AnimatePresence } from "motion/react";

// Import core pages directly for stability
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

// Lazy load secondary pages
const Expenses = React.lazy(() => import("./pages/Expenses"));
const NewExpense = React.lazy(() => import("./pages/NewExpense"));
const Shopping = React.lazy(() => import("./pages/Shopping"));
const Reports = React.lazy(() => import("./pages/Reports"));
const More = React.lazy(() => import("./pages/More"));
const ManageCategories = React.lazy(() => import("./pages/ManageCategories"));
const ManageMerchants = React.lazy(() => import("./pages/ManageMerchants"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-headline font-bold text-primary animate-pulse">العزبه - جاري المزامنة...</p>
      </div>
    );
  }

  if (!user && !loading) {
    // If no user and not loading, it means anonymous login failed or was disabled
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-surface gap-4 p-6 text-center">
        <p className="text-red-500 font-bold">فشل الدخول التلقائي. يرجى التأكد من اتصال الإنترنت.</p>
        <button onClick={() => window.location.reload()} className="text-primary underline">تحديث الصفحة</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <TopBar />
      <div className="pt-2">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.main
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    {children}
  </motion.main>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <div key={location.pathname}>
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
          <Route 
            path="/expenses" 
            element={<ProtectedRoute><PageWrapper><React.Suspense fallback={null}><Expenses /></React.Suspense></PageWrapper></ProtectedRoute>} 
          />
          <Route 
            path="/expenses/new" 
            element={<ProtectedRoute><PageWrapper><React.Suspense fallback={null}><NewExpense /></React.Suspense></PageWrapper></ProtectedRoute>} 
          />
          <Route 
            path="/shopping" 
            element={<ProtectedRoute><PageWrapper><React.Suspense fallback={null}><Shopping /></React.Suspense></PageWrapper></ProtectedRoute>} 
          />
          <Route 
            path="/reports" 
            element={<ProtectedRoute><PageWrapper><React.Suspense fallback={null}><Reports /></React.Suspense></PageWrapper></ProtectedRoute>} 
          />
          <Route 
            path="/more" 
            element={<ProtectedRoute><PageWrapper><React.Suspense fallback={null}><More /></React.Suspense></PageWrapper></ProtectedRoute>} 
          />
          <Route path="/more/categories" element={<ProtectedRoute><PageWrapper><React.Suspense fallback={null}><ManageCategories /></React.Suspense></PageWrapper></ProtectedRoute>} />
          <Route path="/more/merchants"  element={<ProtectedRoute><PageWrapper><React.Suspense fallback={null}><ManageMerchants  /></React.Suspense></PageWrapper></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}
