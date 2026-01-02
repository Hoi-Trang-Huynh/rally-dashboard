"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Link as LinkIcon,
  Activity,
  CheckSquare,
  CalendarDays,
  LogOut,
  User,
  Search,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  const menuItemClass = "h-12 text-base font-medium transition-all duration-200 data-[active=true]:bg-gradient-to-r data-[active=true]:from-pink-50 data-[active=true]:to-transparent dark:data-[active=true]:from-pink-950 dark:data-[active=true]:to-transparent data-[active=true]:text-pink-600 dark:data-[active=true]:text-pink-400 data-[active=true]:border-l-4 data-[active=true]:border-pink-500 rounded-r-lg rounded-l-none pl-3";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="group-data-[collapsible=icon]:!p-2 hover:bg-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="flex aspect-square size-10 group-data-[collapsible=icon]:size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground transition-all">
                  <img 
                    src="/rally_logo_light_inverse.png" 
                    alt="Rally Logo" 
                    className="size-full object-cover rounded-lg"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold text-lg text-foreground">Rally</span>
                  <span className="truncate text-sm text-muted-foreground font-medium">Dashboard</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="gap-2 px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Overview" 
              isActive={pathname === "/"}
              className={menuItemClass}
            >
              <Link href="/">
                <LayoutDashboard className="h-6 w-6" />
                <span>Overview</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Quick Links" 
              isActive={pathname === "/quick-links"}
              className={menuItemClass}
            >
              <Link href="/quick-links">
                <LinkIcon className="h-6 w-6" />
                <span>Quick Links</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Build Monitor" 
              isActive={pathname === "/build-monitor"}
              className={menuItemClass}
            >
              <Link href="/build-monitor">
                <Activity className="h-6 w-6" />
                <span>Build Monitor</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Jira Feeds" 
              isActive={pathname === "/jira-feeds"}
              className={menuItemClass}
            >
              <Link href="/jira-feeds">
                <CheckSquare className="h-6 w-6" />
                <span>Jira Feeds</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Calendar" 
              isActive={pathname === "/calendar"}
              className={menuItemClass}
            >
              <Link href="/calendar">
                <CalendarDays className="h-6 w-6" />
                <span>Calendar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="Admin" 
              isActive={pathname === "/admin"}
              className={menuItemClass}
            >
              <Link href="/admin">
                <ShieldAlert className="h-6 w-6" />
                <span>Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <div className="flex items-center gap-2 h-14 px-2 rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-10 w-10 rounded-xl border-2 border-background shadow-sm">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white font-bold">
                     {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight ml-2 group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-foreground">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="ml-auto p-2 rounded-lg hover:bg-destructive/10 transition-colors group-data-[collapsible=icon]:hidden"
                  title="Sign out"
                >
                  <LogOut className="size-5 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              </div>
            ) : (
             <SidebarMenuButton asChild className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 justify-center shadow-md">
                <Link href="/api/auth/signin">
                  <User className="mr-2 h-5 w-5" />
                  <span className="font-semibold">Sign In</span>
                </Link>
             </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
