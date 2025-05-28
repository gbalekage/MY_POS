import React, { useState, useContext } from "react";
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

const AddPrinter = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [printerData, setPrinterData] = useState({
    name: "",
    type: "",
    ip: "",
    port: 9100,
    isDefault: true,
    canEditPort: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrinterData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      await axios.post(`${serverUrl}/api/printers/add`, printerData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Imprimante ajoutée avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'ajout de l'imprimante."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une imprimante</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom de l'imprimante
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={printerData.name}
                name="name"
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Type d'imprimante
              </label>
              <select
                className="w-full border rounded px-3 py-2"
                value={printerData.type}
                name="type"
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner le type</option>
                <option value="usb">USB</option>
                <option value="network">Réseau</option>
              </select>
            </div>
            {printerData.type === "network" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Adresse IP
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={printerData.ip}
                  name="ip"
                  onChange={handleChange}
                  required={printerData.type === "network"}
                  placeholder="ex: 192.168.1.100"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Port</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={printerData.port}
                  name="port"
                  disabled={!printerData.canEditPort}
                  onChange={handleChange}
                  required
                  min={1}
                  step={1}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPrinterData((prev) => ({
                      ...prev,
                      canEditPort: !prev.canEditPort,
                    }))
                  }
                  disabled={loading}
                >
                  {printerData.canEditPort ? "Annuler" : "Modifier"}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={printerData.isDefault}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="isDefault" className="text-sm">
                Imprimante par défaut
              </label>
            </div>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader className="animate-spin size-2" /> <p>En cours...</p>
                </div>
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPrinter;
