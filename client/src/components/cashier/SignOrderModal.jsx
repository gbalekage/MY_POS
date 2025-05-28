import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";

const SignOrderModal = ({ isOpen, onClose, orderId, token, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        const { data } = await axios.get(`${serverUrl}/api/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomers(data.customers || []);
      } catch (error) {
        console.error("Erreur lors du chargement des clients :", error);
        toast.error("Impossible de charger la liste des clients.");
      }
    };
    if (isOpen) {
      fetchCustomers();
      setSelectedClientId("");
    }
  }, [isOpen, token]);

  const handleSignOrder = async () => {
    if (!selectedClientId) {
      toast.error("Veuillez sélectionner un client.");
      return;
    }
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      await axios.post(
        `${serverUrl}/api/orders/sign/${orderId}/${selectedClientId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Commande signée avec succès.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erreur de signature de commande :", error);
      toast.error(
        error?.response?.data?.message ||
          "Erreur lors de la signature de la commande."
      );
    }
  };

  if (!orderId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Signer la commande #{orderId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <p className="text-sm text-gray-700">
            Veuillez sélectionner un client pour cette facture signée :
          </p>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un client" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer._id} value={customer._id}>
                  {customer.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSignOrder} disabled={!selectedClientId}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOrderModal;
