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
import { Loader } from "lucide-react";

const EditItem = ({ isOpen, onClose, onSuccess, selectedItem }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedItem) {
      setFormData({
        name: selectedItem.name || "",
        description: selectedItem.description || "",
        price: Number(selectedItem.price) || 0,
        stock: Number(selectedItem.stock) || 0,
      });
    }
  }, [selectedItem]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
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
      await axios.put(`${serverUrl}/api/items/${selectedItem._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Item modifié avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la modification de l'item."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier les informations du produit</DialogTitle>
          <DialogDescription>
            Modifiez les champs nécessaires puis validez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom de l'article
              </label>
              <input
                type="text"
                name="name"
                className="w-full border rounded px-3 py-2"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                className="w-full border rounded px-3 py-2"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prix</label>
              <input
                type="number"
                name="price"
                className="w-full border rounded px-3 py-2"
                value={formData.price}
                onChange={handleChange}
                min={0}
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                name="stock"
                className="w-full border rounded px-3 py-2"
                value={formData.stock}
                onChange={handleChange}
                min={0}
                step="1"
                required
              />
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

export default EditItem;
