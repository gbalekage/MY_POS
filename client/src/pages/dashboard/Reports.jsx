import Layout from "@/components/admin/Layout";
import { useEffect, useState, useContext } from "react";
import { UserContext } from "@/context/UserContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const ReportsPage = () => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Helper to aggregate sales by payment method
  const getSalesByPaymentMethod = (sales) => {
    const result = {};
    sales.forEach((sale) => {
      const method = sale.paymentMethod || "Inconnu";
      if (!result[method]) {
        result[method] = {
          paymentMethod: method,
          totalSalesAmount: 0,
          count: 0,
        };
      }
      result[method].totalSalesAmount += sale.totalAmount || 0;
      result[method].count += 1;
    });
    return Object.values(result);
  };

  // Helper to aggregate sales by attendant
  const getSalesByAttendant = (sales) => {
    const result = {};
    sales.forEach((sale) => {
      let attendantName = "Inconnu";
      if (sale.attendant) {
        if (typeof sale.attendant === "object") {
          attendantName =
            sale.attendant.name ||
            sale.attendant.username ||
            sale.attendant._id ||
            "Inconnu";
        } else {
          attendantName = sale.attendant;
        }
      }
      if (!result[attendantName]) {
        result[attendantName] = {
          attendant: attendantName,
          totalSalesAmount: 0,
          count: 0,
        };
      }
      result[attendantName].totalSalesAmount += sale.totalAmount || 0;
      result[attendantName].count += 1;
    });
    return Object.values(result);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      // Fetch all sales (adjust endpoint if needed)
      const salesRes = await axios.get(`${serverUrl}/api/report/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("allSales:", salesRes.data);
      setAllSales(salesRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des ventes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchReports();
    // eslint-disable-next-line
  }, [token, dateRange]);

  // Filter by date range if selected
  const filteredSales =
    dateRange.start && dateRange.end
      ? allSales.filter((sale) => {
          const saleDate = sale.createdAt?.split("T")[0];
          return saleDate >= dateRange.start && saleDate <= dateRange.end;
        })
      : allSales;

  const salesByPaymentMethod = getSalesByPaymentMethod(filteredSales);
  const salesByAttendant = getSalesByAttendant(filteredSales);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Rapports</h1>
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Date de début
            </label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              max={dateRange.end || undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Date de fin
            </label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              min={dateRange.start || undefined}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
        {loading && <div>Chargement des rapports...</div>}
        {!loading && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Ventes par méthode de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                {salesByPaymentMethod.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={salesByPaymentMethod}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="paymentMethod"
                        tick={{ fontSize: 14, fill: "#4a5568" }}
                      />
                      <YAxis tick={{ fontSize: 14, fill: "#4a5568" }} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="totalSalesAmount"
                        fill="#3182ce"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="count"
                        fill="#38a169"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500">Aucune donnée à afficher.</div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Ventes par vendeur</CardTitle>
              </CardHeader>
              <CardContent>
                {salesByAttendant.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={salesByAttendant}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="attendant"
                        tick={{ fontSize: 14, fill: "#4a5568" }}
                      />
                      <YAxis tick={{ fontSize: 14, fill: "#4a5568" }} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="totalSalesAmount"
                        fill="#d69e2e"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="count"
                        fill="#805ad5"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500">Aucune donnée à afficher.</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;
