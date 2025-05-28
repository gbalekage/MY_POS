import { MailIcon, PlusCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

export function NavMain({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {/* <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
              <PlusCircleIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
              variant="outline">
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem> */}
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) =>
            item.dropdown ? (
              <SidebarMenuItem key={item.title}>
                <details className="group" open={item.dropdown.some(sub => window.location.pathname === sub.url)}>
                  <summary
                    className={
                      `flex items-center gap-2 cursor-pointer select-none py-2 px-3 rounded hover:bg-muted ` +
                      (window.location.pathname.startsWith(
                        item.dropdown[0]?.url.split("/")[1]
                          ? `/${item.dropdown[0]?.url.split("/")[1]}`
                          : item.url
                      )
                        ? "bg-muted font-semibold text-primary"
                        : "")
                    }
                  >
                    <span className="flex items-center gap-2">
                      {item.icon && <item.icon className="w-4 h-4" />}{" "}
                      {/* Keep icon small */}
                      <span>{item.title}</span>
                    </span>
                    <svg
                      className="ml-auto w-3 h-3 transition-transform group-open:rotate-90"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M6 8l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>
                  <ul className="ml-6 mt-1 flex flex-col gap-1">
                    {item.dropdown.map((sub) => (
                      <li key={sub.title}>
                        <Link
                          to={sub.url}
                          className={
                            `block py-1 px-2 rounded hover:bg-muted text-sm ` +
                            (window.location.pathname === sub.url
                              ? "bg-muted font-semibold text-primary"
                              : "")
                          }
                        >
                          {sub.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </SidebarMenuItem>
            ) : (
              <SidebarMenuItem key={item.title}>
                <Link
                  to={item.url}
                  className={
                    `flex items-center gap-2 py-2 px-3 rounded hover:bg-muted ` +
                    (window.location.pathname === item.url
                      ? "bg-muted font-semibold text-primary"
                      : "")
                  }
                  style={{ textDecoration: 'none' }}
                >
                  {item.icon && <item.icon className="w-4 h-4" />} {item.title}
                </Link>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
