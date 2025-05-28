import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";
import { toast } from "sonner";

const AddExpenseModal = ({ isOpen, onClose, token, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [branches, setBranches] = useState([]);
  const [amount, setAmount] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        const res = await axios.get(`${serverUrl}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(res.data.stores);
      } catch (error) {
        console.error("Erreur lors du chargement des branches", error);
      }
    };

    if (isOpen) {
      fetchBranches();
      setSelectedBranch("");
    }
  }, [isOpen, token]);

  const handleAdd = async () => {
    if (!selectedBranch) {
      toast.error("Veuillez sélectionner une branche.");
      return;
    }
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      await axios.post(
        `${serverUrl}/api/expenses`,
        { title, amount, branch: selectedBranch },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Dépense ajoutée avec succès.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la dépense :", error);
      toast.error(error.response?.data?.message || "Erreur inconnue");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une dépense</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="block font-semibold mb-1">Titre</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entrez le titre de la dépense"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Montant</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Entrez le montant"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Branche</label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une branche" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch._id} value={branch._id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleAdd} disabled={!selectedBranch}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
