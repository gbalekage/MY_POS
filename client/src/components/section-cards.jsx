import { Link2, TrendingDownIcon, TrendingUpIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/UserContext";
import { toast } from "sonner";
import axios from "axios";

export function SectionCards() {
  const [salesAmount, setSalesAmount] = useState("");
  const [numberOfSales, setNumberOfSales] = useState("");
  const [activeOrdersAmount, setActiveOrdersAmount] = useState("");
  const [nuberOfActiveOrders, setNumberOfOrders] = useState("");
  const [expences, setExpences] = useState("");
  const [discount, setDiscount] = useState("");
  const { user } = useContext(UserContext);
  const token = user?.token;

  const fetchSales = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const response = await axios.get(
        `${serverUrl}/api/report/sales/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const totalAmount = response.data.totalAmount;
      const numberOfSales = response.data.numberOfSales;

      setSalesAmount(totalAmount);
      setNumberOfSales(numberOfSales);
    } catch (error) {
      console.log("Erreur lors de la récupération des ventes :", error);
      toast.error("Impossible de récupérer les ventes.");
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const response = await axios.get(
        `${serverUrl}/api/report/orders/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const totalAmount = response.data.totalAmount;
      const numberOfSales = response.data.numberOfSales;

      setActiveOrdersAmount(totalAmount);
      setNumberOfOrders(numberOfSales);
    } catch (error) {
      console.log(
        "Erreur lors de la récupération des commades actives :",
        error
      );
      toast.error("Impossible de récupérer les commande actives.");
    }
  };

  const fetchExpences = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const response = await axios.get(
        `${serverUrl}/api/report/expences/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const totalAmount = response.data.totalAmount;

      setExpences(totalAmount);
    } catch (error) {
      console.log("Erreur lors de la récupération des depenses :", error);
      toast.error("Impossible de récupérer les depenses.");
    }
  };

  const fetchDiscount = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const response = await axios.get(
        `${serverUrl}/api/report/discount/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const totalAmount = response.data.totalAmount;

      setDiscount(totalAmount);
    } catch (error) {
      console.log("Erreur lors de la récupération des remises :", error);
      toast.error("Impossible de récupérer les remise.");
    }
  };

  useEffect(() => {
    fetchSales();
    fetchActiveOrders();
    fetchExpences();
    fetchDiscount();
    const interval = setInterval(() => {
      fetchSales();
      fetchActiveOrders();
      fetchExpences();
      fetchDiscount();
    }, 60000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
      {/* Ventes complètes aujourd'hui */}
      <Card>
        <CardHeader className="relative">
          <CardDescription>
            Ventes complètes aujourd'hui ({numberOfSales} ventes)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {salesAmount ? salesAmount.toLocaleString() : 0} FC
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="flex gap-2 font-medium">
            Toutes les ventes finalisées pour la journée
            <TrendingUpIcon className="size-4" />
          </div>
        </CardFooter>
      </Card>
      {/* Commandes en attente aujourd'hui */}
      <Card>
        <CardHeader className="relative">
          <CardDescription>
            Commandes en attente ({nuberOfActiveOrders} commandes)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {activeOrdersAmount ? activeOrdersAmount.toLocaleString() : 0} FC
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="flex gap-2 font-medium">
            Commandes non encore payées aujourd'hui
            <TrendingUpIcon className="size-4" />
          </div>
        </CardFooter>
      </Card>
      {/* Dépenses du jour */}
      <Card>
        <CardHeader className="relative">
          <CardDescription>Dépenses du jour</CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {expences ? expences.toLocaleString() : 0} FC
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="flex gap-2 font-medium">
            Total des dépenses enregistrées aujourd'hui
            <TrendingDownIcon className="size-4" />
          </div>
        </CardFooter>
      </Card>
      {/* Remises du jour */}
      <Card>
        <CardHeader className="relative">
          <CardDescription>Remises accordées aujourd'hui</CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {discount ? discount.toLocaleString() : 0} FC
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="flex gap-2 font-medium">
            Total des remises appliquées aujourd'hui
            <TrendingDownIcon className="size-4" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
