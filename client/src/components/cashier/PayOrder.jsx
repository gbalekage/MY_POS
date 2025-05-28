import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import axios from "axios";
import { UserContext } from "@/context/UserContext";

const paymentMethods = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte bancaire" },
  { value: "airtel", label: "Airtel" },
  { value: "orange", label: "Orange" },
  { value: "africell", label: "Africell" },
  { value: "mpesa", label: "Mpesa" },
];

const PayOrderModal = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  onPaymentSuccess,
  setPayModalOpen,
}) => {
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].value);
  const [amountReceived, setAmountReceived] = useState("");
  const [change, setChange] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);
  const token = user?.token;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountReceived("");
      setChange(0);
      setPaymentMethod(paymentMethods[0].value);
    }
  }, [isOpen]);

  // Calculate change to give back
  useEffect(() => {
    const received = parseFloat(amountReceived);
    setChange(!isNaN(received) ? received - totalAmount : 0);
  }, [amountReceived, totalAmount]);

  const handleConfirmPayment = async () => {
    const received = parseFloat(amountReceived);
    if (!token) {
      toast.error("Utilisateur non authentifié.");
      return;
    }
    if (isNaN(received) || received < totalAmount) {
      toast.error(
        "Le montant reçu doit être supérieur ou égal au montant total."
      );
      return;
    }
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      
      const response = await axios.post(
        `${serverUrl}/api/orders/${orderId}/pay`,
        { paymentMethod, receivedAmount: received },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || "Paiement effectué avec succès !");
      onPaymentSuccess?.(orderId);
      onClose();
      setPayModalOpen(false);
    } catch (error) {
      if (error.response?.data?.remainingAmount) {
        toast.error(
          `Montant insuffisant. Il manque ${error.response.data.remainingAmount} XAF.`
        );
      } else {
        toast.error(
          error.response?.data?.message || "Erreur lors du paiement."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement de la commande #{orderId}</DialogTitle>
          <DialogDescription>
            Vérifiez bien le montant reçu avant de confirmer le paiement.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {/* Méthode de paiement */}
          <div>
            <label className="block font-semibold mb-1">
              Méthode de paiement
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={loading}
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          {/* Montant total */}
          <div>
            <label className="block font-semibold mb-1">Montant total</label>
            <input
              type="text"
              readOnly
              value={totalAmount.toLocaleString("fr-FR")}
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>
          {/* Montant reçu */}
          <div>
            <label className="block font-semibold mb-1">Montant reçu</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Entrez le montant reçu"
              disabled={loading}
            />
          </div>
          {/* Reste à rendre */}
          <div>
            <label className="block font-semibold mb-1">Reste à rendre</label>
            <input
              type="text"
              readOnly
              value={
                change >= 0 ? change.toFixed(2).toLocaleString("fr-FR") : "-"
              }
              className={`w-full p-2 border rounded bg-gray-100 ${
                change < 0 ? "text-red-600 font-bold" : ""
              }`}
            />
          </div>
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={loading || change < 0}
          >
            {loading ? "Paiement..." : "Confirmer le paiement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayOrderModal;
