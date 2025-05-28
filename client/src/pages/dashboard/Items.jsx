import AddCategory from "@/components/admin/categories/AddCategory";
import DeleteCategory from "@/components/admin/categories/DeleteCategory";
import EditCategory from "@/components/admin/categories/EditCategory";
import AddItem from "@/components/admin/items/AddItem";
import DeleteItem from "@/components/admin/items/DeleteItem";
import EditItem from "@/components/admin/items/EditItem";
import Layout from "@/components/admin/Layout";
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

const ItemsPage = () => {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModal, seteditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [logsModal, setLogsModal] = useState(false);
  const [logsUser, setLogsUser] = useState(null);

  const fetchItems = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.items);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [token]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleEdit = (selectedItem) => {
    setSelectedItem(selectedItem);
    seteditModal(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteModal(true);
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des produits
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

            <Button onClick={() => handleAdd()}>
              <PlusCircle />
            </Button>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-center">
                  <TableHead>#</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code-barres</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Magasin</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucun produit trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((category, index) => (
                    <TableRow key={category._id} className="cursor-pointer">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.barcode}</TableCell>
                      <TableCell>{category.price} FC</TableCell>
                      <TableCell>{category.stock}</TableCell>
                      <TableCell>{category.store?.name}</TableCell>
                      <TableCell>{category.category?.name}</TableCell>
                      <TableCell>{category.supplier?.name}</TableCell>
                      <TableCell>
                        {category.isActive ? "Actif" : "Inactif"}
                      </TableCell>
                      <TableCell
                        className="space-x-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" onClick={() => handleEdit(category)}>
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(category)}
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
        <AddItem
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={() => {
            fetchItems();
          }}
        />
      )}

      <EditItem
        isOpen={editModal}
        onClose={() => seteditModal(false)}
        onSuccess={() => {
          fetchItems();
        }}
        selectedItem={selectedItem}
      />

      <DeleteItem
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onSuccess={() => {
          fetchItems();
        }}
        selectedItem={itemToDelete}
      />
    </Layout>
  );
};

export default ItemsPage;
