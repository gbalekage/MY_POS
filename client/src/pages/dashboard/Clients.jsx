import AddClient from "@/components/admin/clients/AddClient";
import ClientLogsModal from "@/components/admin/clients/ClientLogsModal";
import DeleteClient from "@/components/admin/clients/DeleteClient";
import EditClient from "@/components/admin/clients/EditClient";
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

const ClientsPage = () => {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editModal, seteditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [logsModal, setLogsModal] = useState(false);
  const [logsUser, setLogsUser] = useState(null);

  const fetchClients = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(response.data.customers);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  const filteredItens = clients.filter((client) =>
    client.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleEdit = (selectedUser) => {
    setSelectedClient(selectedUser);
    seteditModal(true);
  };

  const handleDelete = (user) => {
    setClientToDelete(user);
    setDeleteModal(true);
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des clients
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
                {filteredItens.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucun client trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItens.map((client, index) => (
                    <TableRow
                      key={client._id}
                      onClick={() => {
                        setLogsUser(client);
                        setLogsModal(true);
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{client.fullName}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.address}</TableCell>
                      <TableCell>
                        {client.isActive ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell
                        className="space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" onClick={() => handleEdit(client)}>
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(client)}
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
        <AddClient
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={() => {
            fetchClients();
          }}
        />
      )}
      <EditClient
        isOpen={editModal}
        onClose={() => seteditModal(false)}
        onSuccess={() => {
          fetchClients();
        }}
        selectedClient={selectedClient}
      />
      <DeleteClient
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onSuccess={() => {
          fetchClients();
        }}
        selectedUser={clientToDelete}
      />
      <ClientLogsModal
        isOpen={logsModal}
        onClose={() => setLogsModal(false)}
        user={logsUser}
      />{" "}
    </Layout>
  );
};

export default ClientsPage;
