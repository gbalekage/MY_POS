import React, { useContext, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import ConfigPage from "./pages/config/ConfigPage";
import HomePage from "./pages/main/HomePage";
import { toast, Toaster } from "sonner";
import Connexion from "./pages/config/Connexion";
import { UserContext } from "./context/UserContext";
import Admin from "./pages/dashboard/Admin";
import Manager from "./pages/dashboard/Manager";
import Attendant from "./pages/dashboard/Attendant";
import Cashier from "./pages/dashboard/Cashier";
import { Loader } from "lucide-react";
import { Button } from "./components/ui/button";
import axiosInstance, { setLoginDialogHandler } from "./utils/axiosInstance";
import Login from "./components/main/Login";
import CompanyPage from "./pages/dashboard/Company";
import UsersPage from "./pages/dashboard/Users";
import ClientsPage from "./pages/dashboard/Clients";
import CategoriesPage from "./pages/dashboard/Categories";
import SuppliersPage from "./pages/dashboard/Suppliers";
import StoresPage from "./pages/dashboard/Stores";
import ItemsPage from "./pages/dashboard/Items";
import ReportsPage from "./pages/dashboard/Reports";
import Printers from "./pages/dashboard/Printers";
import Sales from "./pages/dashboard/Sales";
import Expenses from "./pages/dashboard/Expenses";
import SignedBills from "./pages/dashboard/SignedBills";
import PaidSignedBills from "./pages/dashboard/PaidSignedBills";
import Tables from "./pages/dashboard/Tables";
import CloseDay from "./pages/dashboard/CloseDay";

const App = () => {
  const { user, loading, showLogin, setShowLogin } = useContext(UserContext);
  const [delayedLoading, setDelayedLoading] = useState(true);

  useEffect(() => {
    setLoginDialogHandler(setShowLogin); // 👈 Register handler globally
  }, [setShowLogin]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDelayedLoading(false);
    }, 5000);

    if (!loading) {
      clearTimeout(timeout);
      setDelayedLoading(false);
    }

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading || delayedLoading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="flex items-center gap-3 animate-pulse">
          <Loader className="animate-spin size-5" />
          <span className="animate-pulse">
            Chargement de vos informations...
          </span>
        </div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(UserContext);

    if (loading) {
      return null;
    }

    if (!user) {
      return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      return <Navigate to="/not-authorized" replace />;
    }

    return children;
  };

  return (
    <>
      <Routes>
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/retry" element={<Connexion />} />
        <Route
          path="/company"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CompanyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signed-bills"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SignedBills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/paid-signedBills"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PaidSignedBills />
            </ProtectedRoute>
          }
        />
        <Route
          path="/printers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Printers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Tables />
            </ProtectedRoute>
          }
        />
        <Route
          path="/close-day"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CloseDay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stores"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StoresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ItemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Sales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expences"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Expenses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <Manager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={["caissier"]}>
              <Cashier />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendant"
          element={
            <ProtectedRoute allowedRoles={["serveur"]}>
              <Attendant />
            </ProtectedRoute>
          }
        />

        <Route
          path="/not-authorized"
          element={
            <div className="flex h-screen justify-center items-center flex-col">
              <h2 className="text-xl font-semibold text-red-600">
                Accès refusé
              </h2>
              <p className="text-gray-600 mt-2 mb-2">
                Vous n'êtes pas autorisé à accéder à cette page.
              </p>
              <Button>Connecter vous</Button>
            </div>
          }
        />
      </Routes>
      <Login open={showLogin} onOpenChange={setShowLogin} user={user} />
      <Toaster />
    </>
  );
};

export default App;
