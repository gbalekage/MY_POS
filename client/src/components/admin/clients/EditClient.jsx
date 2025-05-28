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

const EditClient = ({ isOpen, onClose, onSuccess, selectedClient }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClient) {
      setFormData({
        fullName: selectedClient.fullName || "",
        phone: selectedClient.phone || "",
        email: selectedClient.email || "",
        address: selectedClient.address || "",
        isActive: selectedClient.isActive ?? true,
      });
    }
  }, [selectedClient]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
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
      await axios.put(
        `${serverUrl}/api/customers/${selectedClient._id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Client modifié avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la modification du client."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier les informations de l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifiez les champs nécessaires puis validez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="fullName"
              >
                Nom du client
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="phone">
                Téléphone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="address"
              >
                Adresse
              </label>
              <input
                type="text"
                id="address"
                name="address"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive" className="text-sm">
                Actif
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
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClient;
