import React, { useState, useEffect, useContext, useCallback } from "react";
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

const AddItem = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;

  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [userData, setUserData] = useState({
    name: "",
    description: "",
    barcode: "",
    price: "",
    stock: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  const generateFourDigitBarcode = useCallback(() => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }, []);

  const resetForm = useCallback(() => {
    setUserData({
      name: "",
      description: "",
      barcode: generateFourDigitBarcode(),
      price: "",
      stock: "",
      isActive: true,
    });
    setSelectedCategory("");
    setSelectedStore("");
    setSelectedSupplier("");
  }, [generateFourDigitBarcode]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configuré");

      const [categoryRes, storesRes, supplierRes] = await Promise.all([
        axios.get(`${serverUrl}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/suppliers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCategories(categoryRes.data.categories);
      setStores(storesRes.data.stores);
      setSuppliers(supplierRes.data.suppliers);

      setUserData((prev) => ({ ...prev, barcode: generateFourDigitBarcode() }));
    } catch (error) {
      console.error("Erreur fetchData :", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  }, [token, generateFourDigitBarcode]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Minimal validation
    if (
      !userData.name ||
      !userData.price ||
      !userData.stock ||
      !selectedCategory ||
      !selectedStore ||
      !selectedSupplier
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configuré");

      await axios.post(
        `${serverUrl}/api/items`,
        {
          ...userData,
          category: selectedCategory,
          store: selectedStore,
          supplier: selectedSupplier,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Article ajouté avec succès !");
      onSuccess && onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Erreur lors de l'ajout"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un article</DialogTitle>
          <DialogDescription>
            Remplissez les informations de l'article.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block mb-1 font-medium">
              Nom de l'article<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="w-full border rounded px-3 py-2"
              value={userData.name}
              onChange={handleInputChange}
              autoFocus
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Description</label>
            <input
              type="text"
              name="description"
              className="w-full border rounded px-3 py-2"
              value={userData.description}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Code-barres</label>
            <input
              type="text"
              name="barcode"
              className="w-full border rounded px-3 py-2"
              value={userData.barcode}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Prix<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              className="w-full border rounded px-3 py-2"
              value={userData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Stock<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              className="w-full border rounded px-3 py-2"
              value={userData.stock}
              onChange={handleInputChange}
              required
              min="0"
              step="1"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Catégorie<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Magasin<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Sélectionner un magasin</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Fournisseur<span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Sélectionner un fournisseur</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
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

export default AddItem;
