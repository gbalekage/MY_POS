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
import { Keyboard } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Expenses = () => {
  const [search, setSearch] = useState("");
  const [expenses, setExpenses] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const fetchExpenses = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(response.data.expenses);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  const openDeleteModal = (expense) => {
    setExpenseToDelete(expense);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      await axios.delete(
        `${serverUrl}/api/expenses/delete/${expenseToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Dépense supprimée avec succès.");
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      fetchExpenses();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression."
      );
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  };

  const filteredItens = expenses.filter((expense) =>
    expense.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Liste des dépenses
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
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-center">
                  <TableHead>#</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItens.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Aucune dépense trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItens.map((expense, index) => (
                    <TableRow key={expense._id} className="cursor-pointer">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell>{expense.amount}</TableCell>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{expense.createdBy?.name || "-"}</TableCell>
                      <TableCell>{expense.branch?.name || "-"}</TableCell>
                      <TableCell className="space-x-2 text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(expense);
                          }}
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
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer cette dépense ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} autoFocus>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Expenses;
