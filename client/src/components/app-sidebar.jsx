import * as React from "react";
import {
  BarChartIcon,
  DatabaseIcon,
  DollarSign,
  DollarSignIcon,
  FileCodeIcon,
  FileTextIcon,
  FolderIcon,
  LayoutDashboardIcon,
  Printer,
  Table2,
  User2,
  User2Icon,
  UsersIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";
import { useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Building2Icon } from "lucide-react";
import { Link } from "react-router-dom";

const data = {
  user: {
    name: "MY POS",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Entreprise",
      url: "/company",
      icon: Building2Icon,
    },
    {
      title: "Utilisateurs",
      url: "/users",
      icon: UsersIcon,
    },
    {
      title: "Clients",
      icon: User2,
      dropdown: [
        { title: "Clients", url: "/client", icon: User2Icon },
        { title: "Dettes", url: "/signed-bills", icon: DollarSignIcon },
        { title: "Payment", url: "/paid-signedBills", icon: DatabaseIcon },
      ],
    },
    {
      title: "Imprimentes",
      url: "/printers",
      icon: Printer,
    },
    {
      title: "Tables",
      url: "/tables",
      icon: Table2,
    },
    {
      title: "Depenses",
      url: "/expences",
      icon: DollarSign,
    },
    {
      title: "Ventes",
      url: "/sales",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Produits",
      icon: FileCodeIcon,
      dropdown: [
        { title: "Catégories", url: "/categories", icon: FolderIcon },
        { title: "Fournisseurs", url: "/suppliers", icon: UsersIcon },
        { title: "Magasins", url: "/stores", icon: DatabaseIcon },
        { title: "Articles", url: "/items", icon: FileTextIcon },
      ],
    },
    {
      title: "Repports",
      icon: BarChartIcon,
      dropdown: [
        { title: "Rapport de Ventes", url: "/reports", icon: FolderIcon },
        { title: "Cloture Journee", url: "/close-day", icon: UsersIcon },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  const [company, setCompany] = useState("");
  const { user } = useContext(UserContext);
  const token = user?.token;

  const fetchCompany = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const response = await axios.get(`${serverUrl}/api/company-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const entreprise = response.data;

      setCompany(entreprise);
    } catch (error) {
      console.log(
        "Erreur lors de la récupération des information de l'entreprise :",
        error
      );
      toast.error("Impossible de récupérer les informations de l'entreprise.");
    }
  };

  useEffect(() => {
    fetchCompany();
    const interval = setInterval(() => fetchCompany, 60000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/admin">
              <span className="">
                <p className="font-bold">{company.name}</p>
                <p className="text-xs">{company.email}</p>
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

// Export navMain for use in Layout
export const navMain = data.navMain;
