import React from "react";
import { useState, useEffect, useContext } from "react";
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
import { Loader } from "lucide-react";

const AddStore = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        const response = await axios.get(`${serverUrl}/api/printers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPrinters(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des imprimente :", error);
        toast.error("Impossible de charger la liste des imprimentes.");
      }
    };
    if (isOpen) {
      fetchPrinters();
      setSelectedPrinter("");
    }
  }, [isOpen, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      await axios.post(
        `${serverUrl}/api/stores`,
        { name, printer: selectedPrinter },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Magasin ajouté avec succès.");
      setName("");
      setSelectedPrinter("");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'ajout du magasin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un magasin</DialogTitle>
          <DialogDescription>
            Remplissez les informations du magasin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Nom du magasin</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Imprimante</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              disabled={loading}
            >
              <option value="">Sélectionner une imprimante</option>
              {printers.map((printer) => (
                <option key={printer._id} value={printer._id}>
                  {printer.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader className="animate-spin size-2" /> <p>En cours...</p>
                </div>
              ) : (
                "Ajouter"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStore;
