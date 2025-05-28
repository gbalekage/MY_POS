import Layout from "@/components/admin/Layout";
import AddPrinter from "@/components/admin/printers/AddPrinter";
import DeletePrinter from "@/components/admin/printers/DeletePrinter";
import EditPrinter from "@/components/admin/printers/EditPrinter";
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

const Printers = () => {
  const [search, setSearch] = useState("");
  const [printers, setPrinters] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [editModal, seteditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [printerToDelete, setPrinterToDelete] = useState(null);
  const [logsModal, setLogsModal] = useState(false);
  const [logsUser, setLogsUser] = useState(null);

  const fetchPrinters = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/printers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrinters(response.data);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, [token]);

  const filteredPrinters = printers.filter((printer) =>
    printer.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleEdit = (selectedPrinter) => {
    setSelectedPrinter(selectedPrinter);
    seteditModal(true);
  };

  const handleDelete = (printer) => {
    setPrinterToDelete(printer);
    setDeleteModal(true);
  };

  const handleTest = async (selectedPrinter) => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const res = await axios.get(
        `${serverUrl}/api/printers/test/${selectedPrinter._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        res.data.message || "Test d'impression envoyé avec succès."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors du test de l'imprimante."
      );
    }
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des imprimentes
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
                  <TableHead>Type</TableHead>
                  <TableHead>Adresse IP</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Par défaut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrinters.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucune imprimante trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrinters.map((printer, index) => (
                    <TableRow key={printer._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{printer.name}</TableCell>
                      <TableCell>
                        {printer.type === "usb"
                          ? "USB"
                          : printer.type === "network"
                          ? "Réseau"
                          : printer.type}
                      </TableCell>
                      <TableCell>
                        {printer.type === "network" ? printer.ip : "-"}
                      </TableCell>
                      <TableCell>{printer.port}</TableCell>
                      <TableCell>{printer.isDefault ? "Oui" : "Non"}</TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => handleTest(printer)}
                        >
                          Test
                        </Button>
                        <Button size="sm" onClick={() => handleEdit(printer)}>
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(printer)}
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
        <AddPrinter
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={() => {
            fetchPrinters();
          }}
        />
      )}

      <EditPrinter
        isOpen={editModal}
        onClose={() => seteditModal(false)}
        onSuccess={() => {
          fetchPrinters();
        }}
        selectedClient={selectedPrinter}
      />

      <DeletePrinter
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onSuccess={() => {
          fetchPrinters();
        }}
        selectedUser={printerToDelete}
      />
    </Layout>
  );
};

export default Printers;
