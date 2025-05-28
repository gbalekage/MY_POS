import Layout from "@/components/admin/Layout";
import AddUser from "@/components/admin/users/AddUser";
import DeleteUser from "@/components/admin/users/DeleteUser";
import EditUser from "@/components/admin/users/EditUser";
import UserLogsModal from "@/components/admin/users/UserLogsModal";
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

const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModal, seteditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [logsModal, setLogsModal] = useState(false);
  const [logsUser, setLogsUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter(
    (userItem) =>
      userItem._id !== user?.id &&
      (userItem.name.toString().includes(search.toLowerCase()) ||
        userItem.username.toString().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    setAddModal(true);
  };

  const handleEdit = (selectedUser) => {
    setSelectedUser(selectedUser);
    seteditModal(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteModal(true);
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des utilisateurs
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
                  <TableHead>Address</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucun utilisateur trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow
                      key={user._id}
                      onClick={() => {
                        setLogsUser(user);
                        setLogsModal(true);
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.address}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.isActive ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell
                        className="space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" onClick={() => handleEdit(user)}>
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDelete(user)}
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
      </section>{" "}
      {addModal && (
        <AddUser
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}
      <EditUser
        isOpen={editModal}
        onClose={() => seteditModal(false)}
        onSuccess={() => {
          fetchUsers();
        }}
        selectedUser={selectedUser}
      />
      <DeleteUser
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onSuccess={() => {
          fetchUsers();
        }}
        selectedUser={userToDelete}
      />
      <UserLogsModal
        isOpen={logsModal}
        onClose={() => setLogsModal(false)}
        user={logsUser}
      />
    </Layout>
  );
};

export default UsersPage;
