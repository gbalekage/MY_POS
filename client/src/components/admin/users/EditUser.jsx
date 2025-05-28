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

const EditUser = ({ isOpen, onClose, onSuccess, selectedUser }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    role: "serveur",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name || "",
        username: selectedUser.username || "",
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        address: selectedUser.address || "",
        role: selectedUser.role || "serveur",
        isActive: selectedUser.isActive ?? true,
      });
    }
  }, [selectedUser]);

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
      await axios.put(`${serverUrl}/api/users/${selectedUser._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Utilisateur modifié avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la modification de l'utilisateur."
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
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                name="name"
                className="w-full border rounded px-3 py-2"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                name="username"
                className="w-full border rounded px-3 py-2"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                className="w-full border rounded px-3 py-2"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Téléphone
              </label>
              <input
                type="text"
                name="phone"
                className="w-full border rounded px-3 py-2"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                name="address"
                className="w-full border rounded px-3 py-2"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rôle</label>
              <select
                name="role"
                className="w-full border rounded px-3 py-2"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="serveur">Serveur</option>
                <option value="caissier">Caissier</option>
              </select>
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
            <Button variant="outline" type="button" onClick={onClose}>
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

export default EditUser;
