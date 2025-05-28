import AddCategory from "@/components/admin/categories/AddCategory";
import DeleteCategory from "@/components/admin/categories/DeleteCategory";
import EditCategory from "@/components/admin/categories/EditCategory";
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

const CategoriesPage = () => {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editModal, seteditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [logsModal, setLogsModal] = useState(false);
  const [logsUser, setLogsUser] = useState(null);

  const fetchCategories = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Categories:", response.data.categories);
      setCategories(response.data.categories);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleEdit = (selectedCategory) => {
    setSelectedCategory(selectedCategory);
    seteditModal(true);
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteModal(true);
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des categories des articles
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
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucune categorie trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category, index) => (
                    <TableRow
                      key={category._id}
                      onClick={() => {
                        setLogsUser(category);
                        setLogsModal(true);
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        {category.isActive ? "Active" : "Inactive"}
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
        <AddCategory
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={() => {
            fetchCategories();
          }}
        />
      )}

      <EditCategory
        isOpen={editModal}
        onClose={() => seteditModal(false)}
        onSuccess={() => {
          fetchCategories();
        }}
        selectedCategory={selectedCategory}
      />

      <DeleteCategory
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onSuccess={() => {
          fetchCategories();
        }}
        selectedCategory={categoryToDelete}
      />
    </Layout>
  );
};

export default CategoriesPage;
