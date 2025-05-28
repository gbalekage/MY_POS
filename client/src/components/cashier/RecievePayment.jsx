import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { toast } from "sonner";
import axios from "axios";

const paymentMethods = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte bancaire" },
  { value: "airtel", label: "Airtel" },
  { value: "orange", label: "Orange" },
  { value: "africell", label: "Africell" },
  { value: "mpesa", label: "Mpesa" },
];

const RecievePayment = ({ isOpen, onClose, token, onSuccess }) => {
  const [signedBills, setSignedBills] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsDialog, setOrderDetailsDialog] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [receivedAmount, setReceivedAmount] = useState("");

  // Fetch signed bills from server
  const fetchSignedBills = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke("get-server-url");
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/report/signedBills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSignedBills(response.data.sales);
    } catch (error) {
      console.error("Erreur lors de la récupération des ventes :", error);
      toast.error("Impossible de récupérer les ventes.");
    }
  };

  useEffect(() => {
    if (token) fetchSignedBills();
  }, [token]);

  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setOrderDetailsDialog(true);
  };

  const payClick = (order) => {
    setSelectedOrder(order);
    setPaymentMethod(paymentMethods[0].value);
    setReceivedAmount("");
    setPayModal(true);
  };

  const closeModals = () => {
    setSelectedOrder(null);
    setOrderDetailsDialog(false);
    setPayModal(false);
  };

  const handlePaymentConfirm = async () => {
    if (!paymentMethod) {
      toast.error("Veuillez sélectionner un mode de paiement.");
      return;
    }
    const amountNum = parseFloat(receivedAmount);
    if (isNaN(amountNum) || amountNum < selectedOrder.totalAmount) {
      toast.error(`Le montant reçu doit être au moins égal à ${selectedOrder.totalAmount.toLocaleString()} FC.`);
      return;
    }
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke("get-server-url");
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.post(
        `${serverUrl}/api/orders/pay/${selectedOrder._id}`,
        { paymentMethod, receivedAmount: amountNum },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || "Paiement réussi !");
      onSuccess?.();
      onClose();
      setPayModal(false);
      fetchSignedBills();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erreur lors du traitement du paiement.");
    }
  };

  const calculateChange = () => {
    const amountNum = parseFloat(receivedAmount);
    if (!selectedOrder || isNaN(amountNum) || amountNum < selectedOrder.totalAmount) return 0;
    return amountNum - selectedOrder.totalAmount;
  };

  return (
    <>
      {/* Liste des factures signées */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Paiement facture signée</DialogTitle>
          </DialogHeader>
          <div className="max-h-[450px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date de signature</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signedBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      Aucune facture signée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  signedBills.map((order, index) => (
                    <TableRow key={order._id} className="cursor-pointer">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{order.customer.fullName}</TableCell>
                      <TableCell>{order.totalAmount.toLocaleString()} FC</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell>
                        <Button onClick={() => payClick(order)}>Payer</Button>
                        <Button variant="link" onClick={() => handleRowClick(order)}>Détails</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Détails de la commande */}
      <Dialog open={orderDetailsDialog} onOpenChange={() => setOrderDetailsDialog(false)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Articles de la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedOrder.items.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{i.item?.name || "Inconnu"}</TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell>{i.price.toLocaleString()} FC</TableCell>
                    <TableCell>{i.total.toLocaleString()} FC</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Aucun article à afficher.</p>
          )}
          <DialogFooter>
            <Button onClick={closeModals}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de paiement */}
      <Dialog open={payModal} onOpenChange={() => setPayModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paiement de la commande</DialogTitle>
            <DialogDescription>Vérifiez bien le montant reçu avant de confirmer le paiement.</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <form onSubmit={e => { e.preventDefault(); handlePaymentConfirm(); }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="paymentMethod" className="block font-medium">Méthode de paiement</label>
                  <select
                    id="paymentMethod"
                    className="w-full border rounded p-2"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="receivedAmount" className="block font-medium">Montant reçu (FC)</label>
                  <input
                    type="number"
                    id="receivedAmount"
                    min={selectedOrder.totalAmount}
                    step="0.01"
                    className="w-full border rounded p-2"
                    value={receivedAmount}
                    onChange={e => setReceivedAmount(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">Montant total dû : {selectedOrder.totalAmount.toLocaleString()} FC</p>
                  {receivedAmount && parseFloat(receivedAmount) >= selectedOrder.totalAmount && (
                    <p className="text-sm text-green-600 mt-1">Monnaie rendue : {calculateChange().toLocaleString()} FC</p>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPayModal(false)}>Annuler</Button>
                <Button type="submit">Confirmer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecievePayment;
