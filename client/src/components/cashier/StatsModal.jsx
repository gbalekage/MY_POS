import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogDescription } from "@radix-ui/react-dialog";

export default function StatsModal({
  isOpen,
  onClose,
  type,
  orders,
  stats,
  paidOrders,
  signedBills,
  expences,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleRowClick = (order) => setSelectedOrder(order);
  const closeItemModal = () => setSelectedOrder(null);

  const renderTableContent = () => {
    if (type === "pendingSales") {
      const filtered = orders.filter((order) => order.status === "pending");
      if (filtered.length === 0)
        return <p>Aucune commande trouvée pour aujourd'hui.</p>;
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Serveur</TableHead>
              <TableHead>Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order, index) => (
              <TableRow
                key={order._id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleRowClick(order)}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{order.attendant?.name}</TableCell>
                <TableCell>{order.totalAmount.toLocaleString()} FC</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    if (type === "completeSales") {
      const filtered = paidOrders.filter((order) => order.status === "paid");
      if (filtered.length === 0)
        return <p>Aucune vente complète trouvée pour aujourd'hui.</p>;
      return (
        <div className="overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Serveur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Mode de payment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order, index) => (
                <TableRow
                  key={order._id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleRowClick(order)}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{order.attendant?.name}</TableCell>
                  <TableCell>{order.totalAmount.toLocaleString()} FC</TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    if (type === "signedBills") {
      if (signedBills.length === 0)
        return <p>Aucune facture signée trouvée pour aujourd'hui.</p>;
      return (
        <div className="overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Serveur</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date de signature</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {signedBills.map((order, index) => (
                <TableRow
                  key={order._id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleRowClick(order)}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{order.attendant?.name}</TableCell>
                  <TableCell>{order.customer?.fullName}</TableCell>
                  <TableCell>{order.totalAmount.toLocaleString()} FC</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    if (type === "expenses") {
      if (expences.length === 0)
        return <p>Aucune facture depense trouvée pour aujourd'hui.</p>;
      return (
        <div className="overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Par</TableHead>
                <TableHead>Branche</TableHead>
                <TableHead>Date de signature</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expences.map((order, index) => (
                <TableRow
                  key={order._id}
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{order.title}</TableCell>
                  <TableCell>{order.amount.toLocaleString()} FC</TableCell>
                  <TableCell>{order.createdBy?.name}</TableCell>
                  <TableCell>{order.branch?.name}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {type === "pendingSales" && "Ventes en attente"}
              {type === "completeSales" && "Ventes complètes"}
              {type === "signedBills" && "Factures signées"}
              {type === "expenses" && "Dépenses"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription />
          <div>{renderTableContent()}</div>
          <DialogFooter>
            <Button onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Nested Modal for Order Items */}
      <Dialog open={!!selectedOrder} onOpenChange={closeItemModal}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Articles de la commande</DialogTitle>
          </DialogHeader>
          <DialogDescription />
          {selectedOrder ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedOrder.items.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{i.item?.name || "Inconnu"}</TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell>{i.price.toLocaleString()} FC</TableCell>
                    <TableCell>{i.total.toLocaleString()} FC</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>Aucun article à afficher.</p>
          )}
          <DialogFooter>
            <Button onClick={closeItemModal}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
