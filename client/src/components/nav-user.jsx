import {
  BellIcon,
  CreditCardIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react";
import { useEffect, useState, useContext } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import LogoutButton from "./main/LogoutButton";
import { UserContext } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function NavUser() {
  const { isMobile } = useSidebar();
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState(null);

  useEffect(() => {
    window.electronAPI.ipcRenderer.invoke("get-server-url").then((url) => {
      setServerUrl(url);
    });
  }, []);

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

  if (!serverUrl) {
    // Optionally show a loading spinner or skeleton here
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage
                  src={
                    user.avatar && user.avatar !== "default-image.jpg"
                      ? `${serverUrl}/images/${user.avatar}`
                      : `${serverUrl}/images/default-image.jpg`
                  }
                  alt={user.name}
                />
                <AvatarFallback className="rounded-lg">
                  {user.name?.slice(0, 2).toUpperCase() || "POS"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={
                      user.avatar && user.avatar !== "default-image.jpg"
                        ? `${serverUrl}/images/${user.avatar}`
                        : `${serverUrl}/images/default-image.jpg`
                    }
                    alt={user.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.slice(0, 2).toUpperCase() || "CN"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserCircleIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {/* <LogOutIcon />
              Log out */}
              <LogoutButton onLogout={handleLogout} loading={loading} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
