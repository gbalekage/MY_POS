import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import LogoutButton from "@/components/main/LogoutButton";
import TableGrid from "@/components/main/TableGrid";
import { UserContext } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import KeyBoard from "@/components/main/KeyBoard";
import { Keyboard, Settings } from "lucide-react";
import Cart from "@/components/main/Cart";

const Attendant = () => {
  const [time, setTime] = useState(new Date());
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const { user, setUser } = useContext(UserContext);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNewOrder, setIsNewOrder] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const token = user?.token;
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [newItems, setNewItems] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchData = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const [itemsRes, categoriesRes, tablesRes] = await Promise.all([
        axios.get(`${serverUrl}/api/items`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${serverUrl}/api/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setItems(itemsRes.data.items);
      setCategories(categoriesRes.data.categories);
      setTables(tablesRes.data.tables);
    } catch (error) {
      console.log("Error", error);
      toast.error(error.response?.data?.message || "Erreur lors du chargement");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString();
  const formattedDate = time.toLocaleDateString();

  const filteredItems = items.filter((item) => {
    const categoryId =
      typeof item.category === "string" ? item.category : item.category?._id;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = selectedCategoryId
      ? categoryId === selectedCategoryId
      : true;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Pagination Logic
  const TABLES_PER_PAGE = 24;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(tables.length / TABLES_PER_PAGE);

  const startIndex = (currentPage - 1) * TABLES_PER_PAGE;
  const paginatedTables = tables.slice(
    startIndex,
    startIndex + TABLES_PER_PAGE
  );

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleTableClick = async (table) => {
    if (table.status === "occupied" && table.orderOwnerId !== user._id) {
      return;
    }

    setSelectedTable(table);
    setSelectedTableId(table._id);

    try {
      console.log("handleTableClick: user=", user);
      console.log("handleTableClick: token=", token);
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const res = await axios.get(
        `${serverUrl}/api/orders/by-table/${table._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const items = res.data.items || [];
      setOrderItems(items);
      setIsNewOrder(items.length === 0); // ✅ nouvelle commande si aucun item

      if (items.length === 0) {
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("handleTableClick error:", error);
      if (error.response?.status === 404) {
        setOrderItems([]);
        setIsNewOrder(true); // ✅ nouvelle commande
        setDialogOpen(true);
      } else {
        const message =
          error.response?.data?.message || error.message || "Erreur inconnue";
        toast.error(message);
      }
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      setTimeout(async () => {
        await window.electronAPI.ipcRenderer.invoke("delete-store-key", "user");
        setUser(null);
        navigate("/");
        toast.success("Utilisateur déconnecté !");
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    try {
      if (!selectedTableId || orderItems.length === 0) {
        toast.error("Veuillez sélectionner une table et des articles.");
        return;
      }

      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const payload = {
        tableId: selectedTableId,
        items: orderItems.map((item) => ({
          itemId: item._id,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post(`${serverUrl}/api/orders`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Commande placée avec succès !");

      setOrderItems([]);
      setSelectedTableId(null);
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors du placement de la commande."
      );
    }
  };

  const addItems = async () => {
    try {
      if (!selectedTableId || newItems.length === 0) {
        toast.error("Aucun nouvel article à ajouter.");
        return;
      }

      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const payload = {
        items: newItems.map((item) => ({
          itemId: item._id,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post(
        `${serverUrl}/api/orders/${selectedTableId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Articles ajoutés avec succès !");
      setNewItems([]);
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de l'ajout des articles à la commande."
      );
    }
  };

  const printBill = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const res = await axios.get(
        `${serverUrl}/api/orders/print-bill/${selectedTableId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Facture imprimer avec success");
    } catch (error) {
      console.log(error);
      toast.error(error.res.data.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="flex items-center gap-2">
          <p className="text-md">Bienvenu</p>
          <p className="font-semibold">{user?.name}</p>
        </h1>
        <div className="flex items-center gap-8 text-gray-600">
          <div className="gap-2 flex">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log("Settings icon clicked");
              setSettingsOpen(true);
            }}
          >
            <Settings />
          </Button>
          <LogoutButton onLogout={handleLogout} loading={loading} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 p-4 gap-4">
        {/* Cart Side */}
        <Cart
          orderItems={orderItems}
          setOrderItems={setOrderItems}
          placeOrder={placeOrder}
          openDialog={() => setDialogOpen(true)}
          isNewOrder={isNewOrder}
          print={printBill}
          addItemsToOrder={addItems}
          setSelectedTable={setSelectedTable}
          selectedTable={selectedTable}
          token={token}
        />

        {/* Tables Display */}
        <div className="w-2/3 flex flex-col overflow-hidden">
          <div className="overflow-y-auto pr-2 max-h-[calc(100vh-12rem)]">
            <TableGrid
              tables={paginatedTables}
              selectedTableId={selectedTableId}
              onTableClick={handleTableClick}
              user={user}
            />
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-[4rem] space-x-4">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="px-2 py-2 text-sm text-gray-600">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Commande - Table {selectedTable?.tableNumber || ""}
            </DialogTitle>
            <DialogDescription>
              Selelction les produits pour la commande
            </DialogDescription>
          </DialogHeader>

          {/* Categories and Items */}
          <div className="flex gap-4">
            {/* Categories list */}
            <div className="w-1/4 border-r pr-4">
              <h3 className="text-sm font-semibold mb-2">Catégories</h3>
              <ul>
                <li
                  onClick={() => setSelectedCategoryId(null)}
                  className={`text-sm mb-1 cursor-pointer ${
                    selectedCategoryId === null
                      ? "font-bold text-green-700"
                      : "text-muted-foreground"
                  }`}
                >
                  Tous
                </li>
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    onClick={() => setSelectedCategoryId(cat._id)}
                    className={`text-sm mb-1 cursor-pointer ${
                      selectedCategoryId === cat._id
                        ? "font-bold text-green-700"
                        : "text-muted-foreground"
                    }`}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Items list */}
            <div className="flex-1">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyboard(true)}
                  className="absolute right-2 top-2 text-gray-600 hover:text-black"
                >
                  <Keyboard />
                </button>
              </div>

              <h3 className="text-sm font-semibold mb-2">Articles</h3>

              <div className="max-h-[320px] overflow-y-auto pr-1">
                {" "}
                {/* 8 items * ~40px height */}
                <ul className="grid grid-cols-2 gap-2">
                  {filteredItems.length === 0 ? (
                    <div className="text-center text-gray-500 col-span-2">
                      Aucun article trouvé dans cette catégorie.
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <li
                        key={item._id}
                        className="p-2 border rounded cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          // Ajoute ou incrémente l'article dans orderItems
                          setOrderItems((prev) => {
                            const found = prev.find(
                              (it) => it._id === item._id
                            );
                            if (found) {
                              return prev.map((it) =>
                                it._id === item._id
                                  ? { ...it, quantity: it.quantity + 1 }
                                  : it
                              );
                            }
                            return [...prev, { ...item, quantity: 1 }];
                          });
                          // Ajoute ou incrémente l'article dans newItems
                          setNewItems((prev) => {
                            const found = prev.find(
                              (it) => it._id === item._id
                            );
                            if (found) {
                              return prev.map((it) =>
                                it._id === item._id
                                  ? { ...it, quantity: it.quantity + 1 }
                                  : it
                              );
                            }
                            return [...prev, { ...item, quantity: 1 }];
                          });
                        }}
                      >
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.price} FC
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres de l'Attendant</DialogTitle>
            <DialogDescription>
              Configurez les paramètres de votre session POS ici.
            </DialogDescription>
          </DialogHeader>
          {/* Place attendant settings form/fields here */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={user?.username || ""}
                disabled
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Nom</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={user?.name || ""}
                disabled
              />
            </div>
            {/* Add more settings fields as needed */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KeyBoard
        open={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onKeyPress={(key) => {
          if (key === "BACKSPACE") {
            setSearch((prev) => prev.slice(0, -1));
          } else {
            setSearch((prev) => prev + key);
          }
        }}
        layout="azerty" // ou "qwerty" selon tes besoins
      />
    </div>
  );
};

export default Attendant;
