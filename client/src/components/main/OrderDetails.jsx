import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Split, Keyboard } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import KeyBoard from "./KeyBoard";

export default function OrderDetailsDialog({
  open,
  onOpenChange,
  orderItems,
  total,
  onRemoveItem,
  onApplyDiscount,
  onSplitBill,
  breakItem,
  orderId,
}) {
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [breakQty, setBreakQty] = useState(1);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [managerPin, setManagerPin] = useState("");
  const [managerUsername, setManagerUsername] = useState("");
  const [pinError, setPinError] = useState("");
  const [itemToRemove, setItemToRemove] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [pendingDiscount, setPendingDiscount] = useState(null);
  const [popoverOpenId, setPopoverOpenId] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(null); // null, 'username', or 'pin'

  const handleOpenBreakModal = (item) => {
    setSelectedItem(item);
    setManagerPin("");
    setPinError("");
    setPinModalOpen(true);
  };

  const toggleSelectItem = (clientId) => {
    setSelectedItems((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleConfirmBreak = () => {
    if (selectedItem && breakQty > 0 && breakQty < selectedItem.quantity) {
      breakItem(selectedItem._id, breakQty);
      setBreakModalOpen(false);
    }
  };

  const validateManagerPin = async () => {
    if (!managerPin || !managerUsername) {
      setPinError("Veuillez entrer le nom d'utilisateur et le PIN.");
      return false;
    }

    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const payload = { username: managerUsername, pin: managerPin };
      const res = await axios.post(`${serverUrl}/api/verify-manager`, payload);
      return res.data.success;
    } catch (err) {
      console.error("Erreur vérification manager:", err);
      setPinError("Erreur de vérification. Vérifiez les identifiants.");
      return false;
    }
  };

  const handleConfirmPin = async () => {
    const isValid = await validateManagerPin();
    if (isValid) {
      setPinModalOpen(false);

      if (itemToRemove) {
        if (Array.isArray(itemToRemove)) {
          onRemoveItem(itemToRemove);
          setSelectedItems([]);
          onOpenChange(false); // Close the order details modal
        } else {
          onRemoveItem([
            { itemId: itemToRemove._id, quantity: itemToRemove.quantity },
          ]);
          onOpenChange(false); // Close the order details modal
        }
        setItemToRemove(null);
        return;
      }

      if (pendingDiscount) {
        onApplyDiscount(orderId, pendingDiscount);
        setPendingDiscount(null);
        return;
      }

      setBreakModalOpen(true);
    }
  };

  const handleKeyPress = (key) => {
    if (key === "BACKSPACE") {
      setManagerUsername((prev) => prev.slice(0, -1));
    } else {
      setManagerUsername((prev) => prev + key);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Détails de la commande
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Liste des articles */}
            <ul className="divide-y max-h-[400px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-muted scrollbar-thumb-rounded-md">
              {orderItems.map((item, index) => {
                const clientId = `${item._id}-${index}`;
                return (
                  <li
                    key={clientId}
                    className="py-4 flex justify-between items-center gap-2"
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(clientId)}
                        onChange={() => toggleSelectItem(clientId)}
                        className="w-6 h-6 accent-primary mt-1"
                      />
                      <div className="text-lg">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-muted-foreground text-base">
                          {item.price.toLocaleString("fr-FR")} FC ×{" "}
                          {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-right min-w-[90px]">
                        {(item.price * item.quantity).toLocaleString("fr-FR")}{" "}
                        FC
                      </span>

                      {/* Supprimer */}
                      <Popover
                        open={popoverOpenId === clientId}
                        onOpenChange={(open) =>
                          setPopoverOpenId(open ? clientId : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-100 w-12 h-12"
                          >
                            <Trash2 className="w-6 h-6 text-red-500" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent
                          className="w-72 text-base"
                          side="top"
                          align="end"
                        >
                          <div className="flex flex-col gap-3">
                            <span>
                              Supprimer <strong>{item.name}</strong> ?
                            </span>
                            <div className="flex justify-end gap-3 pt-2">
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => setPopoverOpenId(null)}
                              >
                                Annuler
                              </Button>
                              <Button
                                variant="destructive"
                                size="lg"
                                onClick={() => {
                                  setPopoverOpenId(null);
                                  setItemToRemove(item);
                                  setManagerPin("");
                                  setPinError("");
                                  setPinModalOpen(true);
                                }}
                              >
                                Confirmer
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Diviser */}
                      {item.quantity > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenBreakModal(item)}
                          className="hover:bg-blue-100 w-12 h-12"
                        >
                          <Split className="w-6 h-6 text-blue-500" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Suppression multiple */}
            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                className="w-full h-14 text-lg font-semibold"
                onClick={() => {
                  const itemsToRemove = selectedItems.map((clientId) => {
                    const [_, index] = clientId.split("-");
                    const item = orderItems[parseInt(index)];
                    return { itemId: item._id, quantity: item.quantity };
                  });
                  setItemToRemove(itemsToRemove);
                  setManagerPin("");
                  setPinError("");
                  setPinModalOpen(true);
                }}
              >
                Supprimer {selectedItems.length > 1 ? "les" : "l’"} article
                {selectedItems.length > 1 ? "s" : ""} sélectionné
                {selectedItems.length > 1 ? "s" : ""}
              </Button>
            )}

            {/* Total */}
            <div className="text-right text-2xl font-bold border-t pt-4">
              Total : {total.toLocaleString("fr-FR")} FC
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-4 pt-4">
              <Button
                variant="outline"
                className="w-full h-14 text-lg font-semibold"
                onClick={() => setDiscountModalOpen(true)}
              >
                Appliquer une réduction
              </Button>
              {/* <Button
                variant="outline"
                className="w-full h-14 text-lg font-semibold"
                onClick={onSplitBill}
              >
                Diviser la facture
              </Button> */}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Break Modal */}
      <Dialog open={breakModalOpen} onOpenChange={setBreakModalOpen}>
        <DialogContent className="max-w-lg px-6 py-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Diviser l’article</DialogTitle>
            <DialogDescription className="text-base">
              Entrez la quantité à séparer de l’article sélectionné.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 pt-4">
              <div className="p-4 bg-muted rounded-xl border shadow-inner text-lg">
                <div className="font-semibold">{selectedItem.name}</div>
                <div className="text-muted-foreground text-base">
                  Quantité disponible : <strong>{selectedItem.quantity}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-lg font-medium">
                  Quantité à séparer
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={1}
                  max={selectedItem.quantity - 1}
                  className="h-14 text-lg"
                  placeholder={`Min: 1, Max: ${selectedItem.quantity - 1}`}
                  value={breakQty}
                  onChange={(e) => setBreakQty(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  variant="ghost"
                  className="h-14 px-6 text-lg"
                  onClick={() => setBreakModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="h-14 px-6 text-lg"
                  onClick={handleConfirmBreak}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PIN Modal */}
      <Dialog
        open={pinModalOpen}
        onOpenChange={(open) => {
          setPinModalOpen(open);
          if (!open) {
            setItemToRemove(null);
            setPendingDiscount(null);
            setManagerUsername("");
            setManagerPin("");
            setPinError("");
          }
        }}
      >
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Vérification du manager
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground"></DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <p className="text-base">
              Entrez le PIN du manager pour autoriser cette action.
            </p>
            <div className="relative mb-2">
              <Input
                type="text"
                value={managerUsername}
                placeholder="Nom d'utilisateur"
                className="text-lg h-12 px-4"
                autoComplete="username"
                onChange={(e) => setManagerUsername(e.target.value)}
              />
              <button
                type="button"
                onClick={() =>
                  setShowKeyboard(
                    showKeyboard === "username" ? null : "username"
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                aria-label="Afficher le clavier tactile"
              >
                <Keyboard />
              </button>
            </div>
            {showKeyboard === "username" && (
              <KeyBoard
                open={true}
                onClose={() => setShowKeyboard(null)}
                onKeyPress={(key) => {
                  if (key === "BACKSPACE") {
                    setManagerUsername((prev) => prev.slice(0, -1));
                  } else {
                    setManagerUsername((prev) => prev + key);
                  }
                }}
                layout="azerty"
              />
            )}
            <div className="relative mb-2">
              <Input
                type="password"
                value={managerPin}
                placeholder="PIN du manager"
                className="text-lg h-12 px-4"
                autoComplete="current-password"
                onChange={(e) => setManagerPin(e.target.value)}
              />
              <button
                type="button"
                onClick={() =>
                  setShowKeyboard(showKeyboard === "pin" ? null : "pin")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                aria-label="Afficher le clavier tactile pour le PIN"
              >
                <Keyboard />
              </button>
            </div>
            {showKeyboard === "pin" && (
              <KeyBoard
                open={true}
                onClose={() => setShowKeyboard(null)}
                onKeyPress={(key) => {
                  if (key === "BACKSPACE") {
                    setManagerPin((prev) => prev.slice(0, -1));
                  } else {
                    setManagerPin((prev) => prev + key);
                  }
                }}
                layout="azerty"
              />
            )}
            {pinError && (
              <p className="text-sm text-red-600 font-medium">{pinError}</p>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setPinModalOpen(false)}
                className="text-lg h-12 px-8"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmPin}
                className="text-lg h-12 px-8"
                disabled={!managerUsername || !managerPin}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount modal */}
      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Choisir une réduction
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground"></DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
              <Button
                key={value}
                variant={selectedDiscount === value ? "default" : "outline"}
                onClick={() => setSelectedDiscount(value)}
                className="text-lg h-14"
              >
                {value}%
              </Button>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setDiscountModalOpen(false)}
              className="text-lg h-12 px-6"
            >
              Annuler
            </Button>
            <Button
              disabled={!selectedDiscount}
              onClick={() => {
                setDiscountModalOpen(false);
                setPendingDiscount(selectedDiscount);
                setManagerPin("");
                setPinError("");
                setPinModalOpen(true);
              }}
              className="text-lg h-12 px-6"
            >
              Appliquer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
