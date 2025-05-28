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

const AddCategory = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [userData, setUserData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      await axios.post(`${serverUrl}/api/categories`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Categorie ajouté avec succès !");
      onSuccess?.();
      onClose();
      setUserData({ name: "", description: "" });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'ajout de la categorie."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une catégorie</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour ajouter une nouvelle catégorie.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium mb-1"
              >
                Nom
              </label>
              <input
                id="category-name"
                name="name"
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={userData.name}
                onChange={handleChange}
                required
                placeholder="Nom de la catégorie"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="category-description"
                className="block text-sm font-medium mb-1"
              >
                Description
              </label>
              <input
                id="category-description"
                name="description"
                type="text"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={userData.description}
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
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategory;
