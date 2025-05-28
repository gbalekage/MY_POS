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

const AddClient = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [userData, setUserData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUserData({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        isActive: true,
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData((prev) => ({
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
      await axios.post(`${serverUrl}/api/customers/add-customer`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Client ajouté avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'ajout du client."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un client</DialogTitle>
          <DialogDescription>
            Remplissez les informations du client ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="fullName"
              >
                Nom
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={userData.fullName}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="phone">
                Numéro de téléphone
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={userData.phone}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={userData.email}
                onChange={handleChange}
                required
                autoComplete="off"
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
                id="address"
                name="address"
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                value={userData.address}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={userData.isActive}
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
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClient;
