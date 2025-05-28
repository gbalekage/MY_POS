import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "@/context/UserContext";

export function SiteHeader({ navItems }) {
  const location = useLocation();
  const { user } = useContext(UserContext);

  let activeTitle = "Documents";
  if (location.pathname === "/admin" && user?.name) {
    activeTitle = `Bonjour ${user.name}`;
  } else if (navItems && Array.isArray(navItems)) {
    for (const item of navItems) {
      if (item.dropdown) {
        const found = item.dropdown.find(
          (sub) => sub.url === location.pathname
        );
        if (found) {
          activeTitle = found.title;
          break;
        }
      } else if (item.url === location.pathname) {
        activeTitle = item.title;
        break;
      }
    }
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{activeTitle}</h1>
      </div>
    </header>
  );
}
