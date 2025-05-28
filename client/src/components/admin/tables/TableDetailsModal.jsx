import React, { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/context/UserContext";
import axios from "axios";

const TableDetailsModal = ({ isOpen, onClose, table }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [order, setOrder] = useState("");

  // Safely get the orderId only if table.currentOrder exists
  const orderId = table.currentOrder?._id;

  const getOrderDetails = async () => {
    if (!orderId) return; // Don't fetch if no order
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data.order);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  useEffect(() => {
    getOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Détails de la table #{table.tableNumber}</DialogTitle>
          <DialogDescription>
            Statut:{" "}
            <span className="font-semibold">
              {table.status === "available" ? "Disponible" : "Occupée"}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="mb-4">
          <div>
            <strong>Serveur assigné:</strong>{" "}
            {table.assignedServer?.name ? (
              table.assignedServer.name
            ) : (
              <span className="text-gray-500">Aucun serveur assigné</span>
            )}
          </div>
          <div>
            <strong>Total:</strong> {table.totalAmount?.toLocaleString() || 0} FC
          </div>
          <div>
            <strong>Créée le:</strong>{" "}
            {new Date(table.createdAt).toLocaleString("fr-FR")}
          </div>
        </div>
        {table.currentOrder && order && order.items ? (
          <div>
            <h3 className="font-bold mb-2">Commande en cours</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.item?.name || "-"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price} FC</TableCell>
                    <TableCell>{item.total} FC</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-2">
              <strong>Montant total:</strong>{" "}
              {order.totalAmount?.toLocaleString() || 0} FC
            </div>
            <div>
              <strong>Statut:</strong> {order.status}
            </div>
            <div>
              <strong>Serveur:</strong> {order.attendant?.name || <span className="text-gray-500">Aucun serveur assigné</span>}
            </div>
            <div>
              <strong>Client:</strong> {order.customer?.fullName || "-"}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            {(!table.currentOrder || !order) ? "Aucune commande en cours pour cette table." : null}
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableDetailsModal;
