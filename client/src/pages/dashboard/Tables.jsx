import Layout from "@/components/admin/Layout";
import AddTables from "@/components/admin/tables/AddTables";
import TableDetailsModal from "@/components/admin/tables/TableDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PlusCircle } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const Tables = () => {
  const [tables, setTables] = useState([]);
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [addModal, setAddModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);

  const fetchTables = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTables(response.data.tables);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [token]);

  const handleAdd = () => {
    setAddModal(true);
  };

  return (
    <Layout>
      <section className="p-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Toutes les Tables
            </CardTitle>

            <Button onClick={() => handleAdd()}>
              <PlusCircle />
            </Button>
          </CardHeader>

          <CardContent>
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <Table>
                <TableHeader>
                  <TableRow className="text-center">
                    <TableHead>#</TableHead>
                    <TableHead>Numero de table</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Serveur</TableHead>
                    <TableHead>Comande</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Aucune table trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tables.map((table, index) => (
                      <TableRow
                        key={table._id}
                        onClick={() => {
                          setSelectedTable(table);
                          setShowTableModal(true);
                        }}
                        className="cursor-pointer"
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>No: {table.tableNumber}</TableCell>
                        <TableCell>
                          {table.status === "available"
                            ? "Disponible"
                            : "Occupée"}
                        </TableCell>
                        <TableCell>
                          {table.assignedServer?.name || (
                            <span className="text-gray-500">
                              Aucun serveur assigné
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.currentOrder?.items?.length > 0 ? (
                            `${table.currentOrder.items.length} article(s)`
                          ) : (
                            <span className="text-gray-500">
                              Aucune commande
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {table.totalAmount?.toLocaleString() || 0} FC
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {addModal && (
        <AddTables
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={() => {
            fetchTables();
          }}
        />
      )}

      {showTableModal && selectedTable && (
        <TableDetailsModal
          isOpen={showTableModal}
          onClose={() => setShowTableModal(false)}
          table={selectedTable}
        />
      )}
    </Layout>
  );
};

export default Tables;
