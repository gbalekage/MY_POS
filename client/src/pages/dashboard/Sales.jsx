import Layout from "@/components/admin/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserContext } from "@/context/UserContext";
import axios from "axios";
import { Keyboard, Printer } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import uniqBy from "lodash/uniqBy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { addDays, format } from "date-fns";

const Sales = () => {
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [customerFilter, setCustomerFilter] = useState("");
  const [attendantFilter, setAttendantFilter] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);
  const [filterInput, setFilterInput] = useState("");

  const fetchSales = async (start, end) => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      let url = `${serverUrl}/api/report/sales`;
      if (start && end) {
        url = `${serverUrl}/api/report/sales/by-date-range?startDate=${start}&endDate=${end}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(response.data);
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Erreur lors du chargement des ventes"
      );
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line
  }, [token]);

  const handleDateFilter = () => {
    const { startDate, endDate } = dateRange[0];
    if (startDate && endDate) {
      fetchSales(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
    } else {
      toast.error("Veuillez sélectionner une plage de dates valide.");
    }
  };

  const handleFilterInput = async () => {
    if (!filterInput) {
      fetchSales();
      return;
    }
    // Try to match payment methods (case-insensitive)
    const paymentMethods = [
      "cash",
      "card",
      "airtel",
      "orange",
      "africell",
      "mpesa",
    ];
    if (paymentMethods.includes(filterInput.toLowerCase())) {
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        const response = await axios.get(
          `${serverUrl}/api/report/sales/by-payment-method?paymentMethod=${filterInput.toLowerCase()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSales(response.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors du filtrage par méthode de paiement"
        );
      }
      return;
    }
    // Otherwise, treat as attendant name (case-insensitive contains)
    const filtered = sales.filter((sale) =>
      sale.attendant?.name?.toLowerCase().includes(filterInput.toLowerCase())
    );
    setSales(filtered);
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg p-4 border-b border-blue-200">
            <CardTitle className="text-lg font-semibold text-blue-900">
              Toutes les ventes
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
              <div className="flex gap-2 items-center bg-white rounded-lg shadow px-2 py-1 border border-blue-200">
                <div className="flex flex-col items-start">
                  <label
                    className="text-xs text-blue-700 mb-1 font-medium"
                    htmlFor="date-start"
                  >
                    Début
                  </label>
                  <Input
                    id="date-start"
                    type="date"
                    value={
                      dateRange[0].startDate
                        ? dateRange[0].startDate.toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setDateRange([
                        {
                          ...dateRange[0],
                          startDate: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        },
                      ])
                    }
                    className="max-w-[140px] border-blue-200 focus:ring-blue-400"
                  />
                </div>
                <span className="text-blue-700 font-bold mt-6">à</span>
                <div className="flex flex-col items-start">
                  <label
                    className="text-xs text-blue-700 mb-1 font-medium"
                    htmlFor="date-end"
                  >
                    Fin
                  </label>
                  <Input
                    id="date-end"
                    type="date"
                    value={
                      dateRange[0].endDate
                        ? dateRange[0].endDate.toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setDateRange([
                        {
                          ...dateRange[0],
                          endDate: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        },
                      ])
                    }
                    className="max-w-[140px] border-blue-200 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start bg-white rounded-lg shadow px-2 py-1 border border-blue-200">
                <label
                  className="text-xs text-blue-700 mb-1 font-medium"
                  htmlFor="filter-input"
                >
                  Serveur ou méthode de paiement
                </label>
                <Input
                  id="filter-input"
                  type="text"
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  placeholder="Ex: John ou cash"
                  className="max-w-[220px] border-blue-200 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                <Button
                  onClick={handleDateFilter}
                  variant="outline"
                  className="border-blue-500 text-blue-700 hover:bg-blue-50"
                >
                  Filtrer par date
                </Button>
                <Button
                  onClick={handleFilterInput}
                  variant="outline"
                  className="border-blue-500 text-blue-700 hover:bg-blue-50"
                >
                  Filtrer
                </Button>
                <Button
                  onClick={() => {
                    setDateRange([
                      { startDate: null, endDate: null, key: "selection" },
                    ]);
                    setFilterInput("");
                    fetchSales();
                  }}
                  variant="ghost"
                  className="text-blue-400 hover:bg-blue-50"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <Table>
                <TableHeader>
                  <TableRow className="text-center">
                    <TableHead>#</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Serveur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date/Heure de signature</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Aucune ventes trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale, index) => (
                      <TableRow
                        key={sale._id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowSaleModal(true);
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>Table {sale.table?.tableNumber}</TableCell>
                        <TableCell>{sale.attendant?.name}</TableCell>
                        <TableCell>{sale.totalAmount} FC</TableCell>
                        <TableCell>{sale.status}</TableCell>
                        <TableCell>
                          {sale.createdAt
                            ? new Date(sale.createdAt).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : ""}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
      {/* Sale Details Modal */}
      <Dialog open={showSaleModal} onOpenChange={setShowSaleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la vente</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" className="absolute top-2 right-2">
                Fermer
              </Button>
            </DialogClose>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Table:</span>{" "}
                {selectedSale.table?.tableNumber || "-"}
              </div>
              <div>
                <span className="font-semibold">Serveur:</span>{" "}
                {selectedSale.attendant?.name || "-"}
              </div>
              <div>
                <span className="font-semibold">Montant total:</span>{" "}
                {selectedSale.totalAmount} FC
              </div>
              <div>
                <span className="font-semibold">Statut:</span>{" "}
                {selectedSale.status}
              </div>
              <div>
                <span className="font-semibold">Méthode de paiement:</span>{" "}
                {selectedSale.paymentMethod}
              </div>
              <div>
                <span className="font-semibold">Date:</span>{" "}
                {selectedSale.createdAt
                  ? new Date(selectedSale.createdAt).toLocaleString("fr-FR")
                  : "-"}
              </div>
              <div className="mt-2">
                <span className="font-semibold">Articles:</span>
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix Unitaire</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.item?.name || "-"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.price} FC</TableCell>
                        <TableCell>{item.total} FC</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Sales;
