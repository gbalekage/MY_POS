import Layout from "@/components/admin/Layout";
import AddSupplier from "@/components/admin/suppliers/AddSupplier";
import DeleteSupplier from "@/components/admin/suppliers/DeleteSupplier";
import EditSupplier from "@/components/admin/suppliers/EditSupplier";
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

const SuppliersPage = () => {
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editModal, seteditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [logsModal, setLogsModal] = useState(false);
  const [logsUser, setLogsUser] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(response.data.suppliers);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [token]);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleEdit = (selectedSupplier) => {
    setSelectedSupplier(selectedSupplier);
    seteditModal(true);
  };

  const handleDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setDeleteModal(true);
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des fourniseurs
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
                  <TableHead>Telephone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucun fourniseur trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier, index) => (
                    <TableRow
                      key={supplier._id}
                      onClick={() => {
                        setLogsUser(supplier);
                        setLogsModal(true);
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell
                        className="space-x-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" onClick={() => handleEdit(supplier)}>
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(supplier)}
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
        <AddSupplier
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={() => {
            fetchSuppliers();
          }}
        />
      )}

      <EditSupplier
        isOpen={editModal}
        onClose={() => seteditModal(false)}
        onSuccess={() => {
          fetchSuppliers();
        }}
        selectedSupplier={selectedSupplier}
      />

      <DeleteSupplier
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onSuccess={() => {
          fetchSuppliers();
        }}
        selectedSupplier={supplierToDelete}
      />
    </Layout>
  );
};

export default SuppliersPage;
