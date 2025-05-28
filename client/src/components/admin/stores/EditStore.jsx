import React, { useState, useContext, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/context/UserContext";
import { toast } from "sonner";
import axios from "axios";
import { Loader } from "lucide-react";

const EditStore = ({ isOpen, onClose, onSuccess, selectedStore }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [name, setName] = useState(selectedStore?.name || "");
  const [printers, setPrinters] = useState([]);
  const [printer, setPrinter] = useState(
    selectedStore?.printer?._id || selectedStore?.printer || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        const respnse = await axios.get(`${serverUrl}/api/printers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPrinters(respnse.data);
      } catch (error) {
        toast.error("Impossible de charger la liste des imprimantes.");
      }
    };
    if (isOpen) {
      fetchPrinters();
    }
  }, [isOpen, token]);

  useEffect(() => {
    setName(selectedStore?.name || "");
    setPrinter(selectedStore?.printer?._id || selectedStore?.printer || "");
  }, [selectedStore]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      await axios.put(
        `${serverUrl}/api/stores/${selectedStore._id}`,
        { name, printer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Magasin modifié avec succès.");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la modification du magasin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le magasin</DialogTitle>
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
              value={printer}
              onChange={(e) => setPrinter(e.target.value)}
              disabled={loading}
            >
              <option value="">Sélectionner une imprimante</option>
              {printers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
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
                "Enregistrer"
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

export default EditStore;
