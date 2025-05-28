import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import axios from "axios";
import { toast } from "sonner";
const paymentMethods = [
  "cash",
  "card",
  "airtel",
  "orange",
  "africell",
  "mpesa",
];

const CloseDay = ({ isOpen, onClose, token, onSuccess }) => {
  const [declaredAmounts, setDeclaredAmounts] = useState({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(null);

  // For future stats if needed
  const [stats] = useState({
    signedBills: 0,
    expenses: 0,
    cancellations: 0,
  });

  const handleAmountChange = (method, value) => {
    setDeclaredAmounts((prev) => ({
      ...prev,
      [method]: parseInt(value) || 0,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    if (!date) {
      setError("Veuillez sélectionner une date.");
      setLoading(false);
      return;
    }
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      await axios.post(
        `${serverUrl}/api/close-day/${date}`,
        { declaredAmounts, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Fermeture de la journée réussie");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Erreur lors de la fermeture de la journée:", err);
      toast.error(err.response?.data?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Fermeture de la journée
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Veuillez sélectionner la date et déclarer les montants encaissés.
          </p>
        </DialogHeader>
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Date à clôturer
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Payment methods */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Montants déclarés par méthode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div key={method} className="flex flex-col">
                <label className="capitalize text-sm font-medium mb-1">
                  {method}
                </label>
                <input
                  type="number"
                  className="border border-gray-300 rounded-lg px-3 py-2 shadow-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={declaredAmounts[method] || ""}
                  onChange={(e) => handleAmountChange(method, e.target.value)}
                  placeholder="Montant déclaré"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (optionnelles)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes ou remarques"
          />
        </div>
        {/* Error message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {/* Footer buttons */}
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Clôture en cours..." : "Clôturer la Journée"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseDay;
