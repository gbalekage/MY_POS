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
import React, { useContext, useEffect, useRef, useState } from "react";
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

const CloseDay = () => {
  const [search, setSearch] = useState("");
  const [repports, setRepports] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [selectedRepport, setSelectedRepport] = useState(null);
  const [showReportModal, setShowRepportModal] = useState(false);
  const [storeNames, setStoreNames] = useState({});
  const fetchingStoreIds = useRef(new Set());

  const fetchReports = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/close-day`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Day closure reports", response.data.reports);
      setRepports(response.data.reports);
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Erreur lors du chargement des ventes"
      );
    }
  };

  // Fetch store name by ID
  const fetchStoreName = async (storeId) => {
    if (
      !storeId ||
      storeNames[storeId] ||
      fetchingStoreIds.current.has(storeId)
    )
      return;
    fetchingStoreIds.current.add(storeId);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStoreNames((prev) => ({ ...prev, [storeId]: response.data.name }));
    } catch (error) {
      setStoreNames((prev) => ({ ...prev, [storeId]: undefined }));
    } finally {
      fetchingStoreIds.current.delete(storeId);
    }
  };

  // When opening the report modal, fetch all store names for the selected report
  useEffect(() => {
    if (showReportModal && selectedRepport?.salesByStore) {
      selectedRepport.salesByStore.forEach((store) => {
        if (store._id && !storeNames[store._id]) {
          fetchStoreName(store._id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReportModal, selectedRepport]);

  useEffect(() => {
    fetchReports();
  }, [token]);

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Rapports de journee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <Table>
                <TableHeader>
                  <TableRow className="text-center">
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead>Vente Total</TableHead>
                    <TableHead>Depences</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repports.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Aucun rapport trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    repports.map((rapport, index) => (
                      <TableRow
                        key={rapport._id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedRepport(rapport);
                          setShowRepportModal(true);
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {rapport.createdAt
                            ? new Date(rapport.date).toLocaleString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : ""}
                        </TableCell>
                        <TableCell>{rapport.cashierName}</TableCell>
                        <TableCell>
                          {rapport.totalSales.toLocaleString("fr-FR")} FC
                        </TableCell>
                        <TableCell>
                          {rapport.expenses.toLocaleString("fr-FR")} FC
                        </TableCell>
                        <TableCell>{rapport.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
      {showReportModal && selectedRepport && (
        <Dialog open={showReportModal} onOpenChange={setShowRepportModal}>
          <DialogContent className="max-w-3xl p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Détails du rapport de journée</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 max-h-[80vh] overflow-y-auto px-6 pb-6">
              {/* Section Infos principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded p-4 border">
                <div>
                  <span className="font-semibold">Date :</span>
                  <br />
                  {selectedRepport.date
                    ? new Date(selectedRepport.date).toLocaleString("fr-FR")
                    : ""}
                </div>
                <div>
                  <span className="font-semibold">Caissier :</span>
                  <br />
                  {selectedRepport.cashierName}
                </div>
                <div>
                  <span className="font-semibold">Vente Total :</span>
                  <br />
                  {selectedRepport.totalSales?.toLocaleString("fr-FR")} FC
                </div>
                <div>
                  <span className="font-semibold">Dépenses :</span>
                  <br />
                  {selectedRepport.expenses?.toLocaleString("fr-FR")} FC
                </div>
                <div>
                  <span className="font-semibold">Statut :</span>
                  <br />
                  {selectedRepport.status}
                </div>
                <div>
                  <span className="font-semibold">Différence totale :</span>
                  <br />
                  {selectedRepport.totalDifference?.toLocaleString("fr-FR")} FC
                </div>
              </div>
              {/* Section Message & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded p-3 border">
                  <span className="font-semibold">Message :</span>
                  <br />
                  {selectedRepport.message}
                </div>
                <div className="bg-yellow-50 rounded p-3 border">
                  <span className="font-semibold">Notes :</span>
                  <br />
                  {selectedRepport.notes}
                </div>
              </div>
              {/* Section Paiements */}
              <div>
                <div className="font-semibold mb-1 text-blue-700">
                  Résumé des paiements
                </div>
                <table className="min-w-full text-sm border rounded">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="border px-2 py-1">Méthode</th>
                      <th className="border px-2 py-1">Total</th>
                      <th className="border px-2 py-1">Déclaré</th>
                      <th className="border px-2 py-1">Différence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRepport.paymentSummary?.map((p, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{p.method}</td>
                        <td className="border px-2 py-1">
                          {p.total?.toLocaleString("fr-FR")} FC
                        </td>
                        <td className="border px-2 py-1">
                          {p.declared?.toLocaleString("fr-FR")} FC
                        </td>
                        <td className="border px-2 py-1">
                          {p.difference?.toLocaleString("fr-FR")} FC
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Section Ventes par magasin */}
              <div>
                <div className="font-semibold mb-1 text-green-700">
                  Ventes par magasin
                </div>
                {selectedRepport.salesByStore?.map((store, i) => (
                  <div key={i} className="mb-4 border rounded p-2 bg-green-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-green-900">
                        {storeNames[store._id] || store.name || store._id}
                      </span>
                      <span className="font-semibold">
                        Total: {store.storeTotal?.toLocaleString("fr-FR")} FC
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border rounded">
                        <thead className="bg-green-100">
                          <tr>
                            <th className="border px-2 py-1">Article</th>
                            <th className="border px-2 py-1">Quantité</th>
                            <th className="border px-2 py-1">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {store.items.map((item, j) => (
                            <tr key={j}>
                              <td className="border px-2 py-1">{item.name}</td>
                              <td className="border px-2 py-1">
                                {item.quantity}
                              </td>
                              <td className="border px-2 py-1">
                                {item.total?.toLocaleString("fr-FR")} FC
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              {/* Section Ventes par serveur */}
              <div>
                <div className="font-semibold mb-1 text-purple-700">
                  Ventes par serveur
                </div>
                <table className="min-w-full text-sm border rounded">
                  <thead className="bg-purple-100">
                    <tr>
                      <th className="border px-2 py-1">Serveur</th>
                      <th className="border px-2 py-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRepport.salesByAttendant?.map((a, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{a.attendant}</td>
                        <td className="border px-2 py-1">
                          {a.total?.toLocaleString("fr-FR")} FC
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Section Remises, Annulations, Factures signées */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-pink-50 rounded p-3 border text-center">
                  <span className="font-semibold">Remises</span>
                  <br />
                  <span className="text-lg">
                    {selectedRepport.discounts?.toLocaleString("fr-FR")} FC
                  </span>
                </div>
                <div className="bg-orange-50 rounded p-3 border text-center">
                  <span className="font-semibold">Annulations</span>
                  <br />
                  <span className="text-lg">
                    {selectedRepport.cancellations?.toLocaleString("fr-FR")} FC
                  </span>
                </div>
                <div className="bg-indigo-50 rounded p-3 border text-center">
                  <span className="font-semibold">Factures signées</span>
                  <br />
                  <span className="text-lg">
                    {selectedRepport.signedBills?.toLocaleString("fr-FR")} FC
                  </span>
                </div>
              </div>
            </div>
            <DialogClose asChild>
              <Button className="mt-6 w-full">
                Fermer
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
};

export default CloseDay;
