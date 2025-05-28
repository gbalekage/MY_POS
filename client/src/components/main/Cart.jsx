import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import OrderDetailsDialog from "./OrderDetails";
import { useState } from "react";
import axios from "axios";

export default function Cart({
  orderItems,
  setOrderItems,
  placeOrder,
  openDialog,
  isNewOrder,
  print,
  addItemsToOrder,
  setSelectedTable,
  selectedTable,
  token,
}) {
  const [showDialog, setShowDialog] = useState(false);

  const orderId = selectedTable?.currentOrder;

  const updateQuantity = (id, delta) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setOrderItems((prev) => prev.filter((item) => item._id !== id));
  };

  const total = orderItems.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  const handlePlaceOrder = () => {
    placeOrder();
    setOrderItems([]);
    setSelectedTable(null);
  };

  const handleAddItemsToOrder = () => {
    addItemsToOrder();
    setOrderItems([]);
    setSelectedTable(null);
  };

  const breakItems = async (itemId, breakQty) => {
    try {
      console.log("ID de l'article à diviser :", itemId);
      console.log("Quantité à diviser :", breakQty);

      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      // Appel correct avec axios
      const response = await axios.post(
        `${serverUrl}/api/orders/break-items/${orderId}`,
        {
          itemId,
          quantityToBreak: breakQty,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      // Mise à jour des items
      const updatedItems = data.order.items.map((item) => ({
        _id: item.item._id || item.item,
        name: item.item.name || "Nom inconnu",
        price: item.price,
        quantity: item.quantity,
      }));

      console.log("Updated Items", updatedItems);

      setOrderItems(updatedItems);
      toast.success("Article divisé avec succès");
      setShowDialog(false);
    } catch (error) {
      console.log(error);
      const errorMessage =
        error.response?.data?.message ||
        "Erreur réseau lors de la division de l'article";
      toast.error(errorMessage);
    }
  };

  const removeItemsFromOrder = async (itemsWithQuantities) => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const itemsToCancel = itemsWithQuantities.map(({ itemId, quantity }) => ({
        itemId,
        quantity,
      }));

      const response = await axios.put(
        `${serverUrl}/api/orders/${orderId}/cancel-items`,
        {
          itemsToCancel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      const updatedItems = data.order.items.map((item) => ({
        _id: item.item._id || item.item,
        name: item.item.name || "Nom inconnu",
        price: item.price,
        quantity: item.quantity,
      }));

      console.log("ID de la commande", orderId);

      setOrderItems(updatedItems);
      toast.success("Articles supprimés avec succès");
      setShowDialog(false);
    } catch (error) {
      console.log(error);
      const errorMessage = error.response.data.message;
      toast.error(errorMessage);
    }
  };

  const applyDiscount = async (orderId, discount) => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const discountPercentage = discount;

      console.log("Pourcentage selectionner", discountPercentage);

      const response = await axios.post(
        `${serverUrl}/api/orders/${orderId}/discount`,
        { discountPercentage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Réduction de ${discount}% appliquée avec succès.`);
      setShowDialog(false);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="w-1/3 bg-white rounded-2xl shadow p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Panier</h2>

      {orderItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun article sélectionné.
        </p>
      ) : (
        <>
          {isNewOrder ? (
            ""
          ) : (
            <>
              <div className="text-center p-4">
                <Button
                  variant="link"
                  className="w-1/2"
                  onClick={() => setShowDialog(true)}
                >
                  Voir la commande
                </Button>
              </div>
            </>
          )}

          <ul className="overflow-auto max-h-[calc(100vh-20rem)] divide-y">
            {orderItems.map((item) => (
              <li
                key={item._id}
                className="flex justify-between items-center py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.price.toLocaleString("fr-FR")} FC x {item.quantity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateQuantity(item._id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateQuantity(item._id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item._id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 text-right text-base font-semibold">
            Total : {total.toLocaleString("fr-FR")} FC
          </div>

          <div className="flex gap-2 mt-4">
            {isNewOrder ? (
              <Button className="w-full" onClick={handlePlaceOrder}>
                Placer la commande
              </Button>
            ) : (
              <>
                <Button
                  className="w-1/2"
                  variant="outline"
                  onClick={openDialog}
                >
                  Ajouter
                </Button>
                <Button
                  className="w-1/2"
                  variant="outline"
                  onClick={handleAddItemsToOrder}
                >
                  Ajouter des articles
                </Button>
                <Button className="w-1/2" onClick={print}>
                  Imprimer la Facture
                </Button>
              </>
            )}
          </div>
        </>
      )}
      <OrderDetailsDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        orderItems={orderItems}
        total={total}
        onRemoveItem={removeItemsFromOrder}
        onApplyDiscount={applyDiscount}
        onSplitBill={() => console.log("Split...")}
        breakItem={(itemId, breakQty) => breakItems(itemId, breakQty)}
        orderId={orderId}
      />
    </div>
  );
}
