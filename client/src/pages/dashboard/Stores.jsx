import AddStore from "@/components/admin/stores/AddStore";
import EditStore from "@/components/admin/stores/EditStore";
import DeleteStore from "@/components/admin/stores/DeleteStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserContext } from "@/context/UserContext";
import axios from "axios";
import { Keyboard, PlusCircle } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/admin/Layout";

const StoresPage = () => {
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState(null);
  const [storeToDelete, setStoreToDelete] = useState(null);

  const fetchStores = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(response.data.stores);
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du chargement des magasins."
      );
    }
  };

  useEffect(() => {
    fetchStores();
  }, [token]);

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleEdit = (store) => {
    setStoreToEdit(store);
    setEditModal(true);
  };

  const handleDelete = (store) => {
    setStoreToDelete(store);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      await axios.delete(`${serverUrl}/api/stores/${storeToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Magasin supprimé avec succès.");
      setDeleteModal(false);
      setStoreToDelete(null);
      fetchStores();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la suppression du magasin."
      );
      setDeleteModal(false);
      setStoreToDelete(null);
    }
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des magasins
            </CardTitle>
            <div className="relative mb-2">
              <Input
                placeholder="Rechercher..."
                className="w-full sm:w-64 border-gray-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black"
                aria-label="Aficher le clavier tactile"
              >
                <Keyboard />
              </button>
            </div>

            <Button onClick={handleAdd}>
              <PlusCircle />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-center">
                  <TableHead>#</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Imprimante</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucun magasin trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store, index) => (
                    <TableRow key={store._id} className="cursor-pointer">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{store.printer?.name || "-"}</TableCell>
                      <TableCell className="space-x-2 text-center">
                        <Button size="sm" onClick={() => handleEdit(store)}>
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(store)}
                        >
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
      {addModal && (
        <AddStore
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={fetchStores}
        />
      )}
      {editModal && (
        <EditStore
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          onSuccess={fetchStores}
          selectedStore={storeToEdit}
        />
      )}
      {deleteModal && (
        <DeleteStore
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          onSuccess={fetchStores}
          selectedStore={storeToDelete}
          onDelete={confirmDelete}
        />
      )}
    </Layout>
  );
};

export default StoresPage;
