import LogoutButton from "@/components/main/LogoutButton";
import { UserContext } from "@/context/UserContext";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import StatsModal from "@/components/cashier/StatsModal";
import PayOrderModal from "@/components/cashier/PayOrder";
import SignOrderModal from "@/components/cashier/SignOrderModal";
import AddExpenseModal from "@/components/cashier/AddExpences";
import RecievePayment from "@/components/cashier/RecievePayment";
import CloseDay from "@/components/cashier/CloseDay";
import { Keyboard } from "lucide-react";
import KeyBoard from "@/components/main/KeyBoard";

const Cashier = () => {
  const { user, setUser } = useContext(UserContext);
  const [time, setTime] = useState(() => new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const token = user?.token;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payOrderId, setPayOrderId] = useState(null);
  const [payOrderAmount, setPayOrderAmount] = useState(0);
  const [paidOrders, setPaidOrders] = useState([]);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signOrderId, setSignOrderId] = useState(null);
  const [signedBills, setSignedBills] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expences, setExpences] = useState([]);
  const [receivePaymentModal, setReceivedPaymentModal] = useState(false);
  const [closeDay, setCloseDay] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [stats, setStats] = useState({
    pendingSales: 0,
    completeSales: 0,
    signedBills: 0,
    expenses: 0,
  });
  const [totalStats, setTOtalStats] = useState({
    pendingSales: 0,
    completeSales: 0,
    signedBills: 0,
    expenses: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString();
  const formattedDate = time.toLocaleDateString();

  const toggleDropdown = () => setIsDropdownOpen((open) => !open);

  const handlePay = (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return toast.error("Commande introuvable");
    setPayOrderId(orderId);
    setPayOrderAmount(order.totalAmount);
    setPayModalOpen(true);
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setPayOrderId(null);
    setPayOrderAmount(0);
  };

  const handleSign = (orderId) => {
    setSignOrderId(orderId);
    setSignModalOpen(true);
  };

  const onPaymentSuccess = async (orderId) => {
    await Promise.all([
      fetchOrders(),
      fetchStats(),
      fetchPaidOrders(),
      fetchTotalStats(),
      fetchSignedBills(),
      fetchExpences(),
    ]);
    setOrders((prev) => prev.filter((order) => order._id !== orderId));
    toast.success(`Commande ${orderId} payée et retirée.`);
    closePayModal();
  };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
  };

  // Fetch functions (orders, stats, etc.)
  const fetchOrders = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/today/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.orders);
    } catch (error) {
      toast.error("Impossible de récupérer les commandes.");
    }
  };

  const fetchPaidOrders = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/report/sales/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaidOrders(response.data.sales);
    } catch (error) {
      toast.error("Impossible de récupérer les ventes .");
    }
  };

  const fetchSignedBills = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(
        `${serverUrl}/api/report/signed/signedBills`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSignedBills(response.data.sales);
    } catch (error) {
      toast.error("Impossible de récupérer les ventes .");
    }
  };

  const fetchExpences = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/expences/for-today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpences(response.data.sales);
    } catch (error) {
      toast.error("Impossible de récupérer les depenses .");
    }
  };

  const fetchStats = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const [signedRes, paidRes, ordersRes, expenceRes] = await Promise.all([
        axios.get(`${serverUrl}/api/signed/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/paid/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/orders/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/expences/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStats({
        signedBills: signedRes.data.signedSales,
        completeSales: paidRes.data.paidSales,
        pendingSales: ordersRes.data.orders,
        expenses: expenceRes.data.expences,
      });
    } catch (error) {
      toast.error("Impossible de récupérer les statistiques.");
    }
  };

  const fetchTotalStats = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const [signedRes, paidRes, ordersRes, expenceRes] = await Promise.all([
        axios.get(`${serverUrl}/api/report/signedBills/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/report/sales/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/report/orders/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/report/expences/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setTOtalStats({
        signedBills: signedRes.data.totalAmount,
        completeSales: paidRes.data.totalAmount,
        pendingSales: ordersRes.data.totalAmount,
        expenses: expenceRes.data.totalAmount,
      });
    } catch (error) {
      toast.error("Impossible de récupérer les statistiques.");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPaidOrders();
    fetchStats();
    fetchTotalStats();
    fetchSignedBills();
    fetchExpences();
    const interval = setInterval(() => {
      fetchStats();
      fetchTotalStats();
    }, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const filteredOrders = orders.filter(
    (order) =>
      order.table?.tableNumber?.toString().includes(search.toLowerCase()) ||
      order.attendant?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    setLoading(true);
    try {
      setTimeout(async () => {
        await window.electronAPI.ipcRenderer.invoke("delete-store-key", "user");
        setUser(null);
        navigate("/");
        toast.success("Utilisateur déconnecté !");
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
      setLoading(false);
    }
  };

  const handleKeyPress = (key) => {
    if (key === "BACKSPACE") setSearch((prev) => prev.slice(0, -1));
    else setSearch((prev) => prev + key);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="flex items-center gap-2 text-lg">
          <p className="text-md text-gray-700">Bienvenu</p>
          <p className="font-semibold text-gray-800">{user?.name}</p>
        </h1>
        <div className="flex items-center gap-8 text-gray-600">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{formattedDate}</span>
            <span className="text-lg font-medium">{formattedTime}</span>
          </div>
          <LogoutButton onLogout={handleLogout} loading={loading} />
        </div>
      </header>

      {/* Stat Cards Section */}
      <section className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card
          onClick={() => openModal("pendingSales")}
          className="cursor-pointer hover:shadow-lg transition-all"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium">
              Ventes en attente
            </CardTitle>
            <CardDescription className="bg-green-200 p-2 rounded-full text-xs font-medium">
              Total: {totalStats.pendingSales} FC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.pendingSales}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => openModal("completeSales")}
          className="cursor-pointer hover:shadow-lg transition-all"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium">
              Ventes complètes
            </CardTitle>
            <CardDescription className="bg-green-200 p-2 rounded-full text-xs font-medium">
              Total: {totalStats.completeSales} FC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.completeSales}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => openModal("signedBills")}
          className="cursor-pointer hover:shadow-lg transition-all"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium">
              Factures signées
            </CardTitle>
            <CardDescription className="bg-green-200 p-2 rounded-full text-xs font-medium">
              Total: {totalStats.signedBills} FC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.signedBills}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => openModal("expenses")}
          className="cursor-pointer hover:shadow-lg transition-all"
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium">Dépenses</CardTitle>
            <CardDescription className="bg-green-200 p-2 rounded-full text-xs font-medium">
              Total: {totalStats.expenses} FC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.expenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Action Buttons */}
      <section className="p-6 flex justify-end">
        {/* Dropdown Trigger Button */}
        <div className="relative">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={toggleDropdown} // Toggle the dropdown on button click
          >
            Actions
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>

          {/* Dropdown Menu - Visibility controlled by isDropdownOpen */}
          <div
            className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 ${
              isDropdownOpen ? "block" : "hidden"
            }`}
          >
            <div className="p-2">
              <Button
                variant="link"
                className="w-full text-left"
                onClick={() => setReceivedPaymentModal(true)}
              >
                Recevoir Paiement
              </Button>
              <Button
                variant="link"
                className="w-full text-left"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                Ajouter une dépense
              </Button>
              <Button
                variant="link"
                className="w-full text-left"
                onClick={() => setCloseDay(true)}
              >
                Clôturer la journée
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Orders Table */}
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Commandes actives
            </CardTitle>
            <div className="relative mb-2">
              <Input
                placeholder="Rechercher..."
                className="w-full sm:w-64 border-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowKeyboard(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                aria-label="Afficher le clavier tactile"
              >
                <Keyboard />
              </button>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Serveur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucune commande active trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <TableRow key={order._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{order.table?.tableNumber}</TableCell>
                      <TableCell>{order.attendant.name}</TableCell>
                      <TableCell>
                        {order.totalAmount.toLocaleString()} FC
                      </TableCell>
                      <TableCell>
                        <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => handlePay(order._id)}>
                          Payer
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSign(order._id)}
                        >
                          Signer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Modals */}
      <StatsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        type={modalType}
        orders={orders}
        stats={stats}
        paidOrders={paidOrders}
        signedBills={signedBills}
        expences={expences}
      />
      <PayOrderModal
        isOpen={payModalOpen}
        onClose={closePayModal}
        orderId={payOrderId}
        totalAmount={payOrderAmount}
        onPaymentSuccess={onPaymentSuccess}
        setPayModalOpen={setPayModalOpen}
      />
      <SignOrderModal
        isOpen={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        orderId={signOrderId}
        token={token}
        onSuccess={() => {
          fetchOrders();
          fetchPaidOrders();
          fetchStats();
          fetchTotalStats();
          fetchSignedBills();
          fetchExpences();
        }}
      />
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        token={token}
        onSuccess={() => {
          fetchOrders();
          fetchPaidOrders();
          fetchStats();
          fetchTotalStats();
          fetchSignedBills();
          fetchExpences();
        }}
      />

      <RecievePayment
        isOpen={receivePaymentModal}
        onClose={() => setReceivedPaymentModal(false)}
        token={token}
        signedBills={signedBills}
        onSuccess={() => {
          fetchOrders();
          fetchPaidOrders();
          fetchStats();
          fetchTotalStats();
          fetchSignedBills();
          fetchExpences();
        }}
      />

      <CloseDay
        isOpen={closeDay}
        onClose={() => setCloseDay(false)}
        token={token}
        onSuccess={() => {
          fetchOrders();
          fetchPaidOrders();
          fetchStats();
          fetchTotalStats();
          fetchSignedBills();
          fetchExpences();
          setUser(null);
          navigate("/");
        }}
      />

      <KeyBoard
        open={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onKeyPress={handleKeyPress}
        layout="azerty" // or "qwerty"
      />
    </div>
  );
};

export default Cashier;
