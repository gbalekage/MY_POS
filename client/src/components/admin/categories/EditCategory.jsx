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

const EditCategory = ({ isOpen, onClose, onSuccess, selectedCategory }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      setFormData({
        name: selectedCategory.name || "",
        description: selectedCategory.description || "",
      });
    }
  }, [selectedCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        `${serverUrl}/api/categories/${selectedCategory._id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Categorie modifiée avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la modification de la catégorie."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la catégorie</DialogTitle>
          <DialogDescription>
            Modifiez les champs nécessaires puis validez.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-category-name"
                className="block text-sm font-medium mb-1"
              >
                Nom de la catégorie
              </label>
              <input
                id="edit-category-name"
                type="text"
                name="name"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nom de la catégorie"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="edit-category-description"
                className="block text-sm font-medium mb-1"
              >
                Description
              </label>
              <input
                id="edit-category-description"
                type="text"
                name="description"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Description de la catégorie"
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

export default EditCategory;
