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
import { Keyboard } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import uniqBy from "lodash/uniqBy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const PaidSignedBills = () => {
  const [search, setSearch] = useState("");
  const [signedBills, setSignedBills] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [customerFilter, setCustomerFilter] = useState("");
  const [attendantFilter, setAttendantFilter] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  const fetchSignedBills = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(
        `${serverUrl}/api/report/paidsignedbills`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSignedBills(response.data);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchSignedBills();
  }, [token]);

  // Get unique customers and attendants from signedBills
  const uniqueCustomers = uniqBy(
    signedBills.map((b) => b.customer).filter(Boolean),
    "_id"
  );

  // Filtering logic
  const filteredBills = signedBills.filter((bill) => {
    const matchesSearch = bill.title
      ? bill.title.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCustomer = customerFilter
      ? bill.customer?._id === customerFilter
      : true;
    return matchesSearch && matchesCustomer;
  });
  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Factures payées
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex gap-4 mb-4">
              <select
                className="border rounded px-2 py-1"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              >
                <option value="">Tous les clients</option>
                {uniqueCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-center">
                  <TableHead>#</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Serveur</TableHead>
                  <TableHead>Montant total</TableHead>
                  <TableHead>Moyen de paiement</TableHead>
                  <TableHead>Date/Heure de paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucune facture payée trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill, index) => (
                    <TableRow
                      key={bill._id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedBill(bill);
                        setShowBillModal(true);
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{bill.customer?.fullName}</TableCell>
                      <TableCell>{bill.attendant?.name}</TableCell>
                      <TableCell>{bill.totalAmount} FC</TableCell>
                      <TableCell>{bill.paymentMethod}</TableCell>
                      <TableCell>
                        {bill.createdAt
                          ? new Date(bill.createdAt).toLocaleString("fr-FR", {
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
          </CardContent>
        </Card>
        <Dialog open={showBillModal} onOpenChange={setShowBillModal}>
          <DialogContent className="p-0 max-w-lg">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full relative">
              <DialogClose asChild>
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-black"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </DialogClose>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold mb-4">
                  Détails de la facture payée
                </DialogTitle>
              </DialogHeader>
              <div className="mb-2">
                <strong>Client :</strong> {selectedBill?.customer?.fullName}
              </div>
              <div className="mb-2">
                <strong>Serveur :</strong> {selectedBill?.attendant?.name}
              </div>
              <div className="mb-2">
                <strong>Date/Heure de paiement :</strong>{" "}
                {selectedBill?.createdAt
                  ? new Date(selectedBill.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : ""}
              </div>
              <div className="mb-2">
                <strong>Moyen de paiement :</strong>{" "}
                {selectedBill?.paymentMethod}
              </div>
              <div className="mb-2">
                <strong>Montant reçu :</strong> {selectedBill?.receivedAmount}{" "}
                FC
              </div>
              <div className="mb-2">
                <strong>Monnaie rendue :</strong> {selectedBill?.change} FC
              </div>
              <table className="w-full border mb-4">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Article</th>
                    <th className="border px-2 py-1">Prix unitaire</th>
                    <th className="border px-2 py-1">Quantité</th>
                    <th className="border px-2 py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill?.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">
                        {item.item?.name || "-"}
                      </td>
                      <td className="border px-2 py-1">{item.price} FC</td>
                      <td className="border px-2 py-1">{item.quantity}</td>
                      <td className="border px-2 py-1">{item.total} FC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right font-bold">
                Montant total : {selectedBill?.totalAmount} FC
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
};

export default PaidSignedBills;
