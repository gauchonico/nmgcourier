import { LayoutDashboard, Users, Package, TrendingUp,BadgeDollarSign, MapPin, ChevronLeft, DollarSign, Car, Search } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Shipments", url: "/admin/shipments", icon: Package },
  { title: "Manage",     url: "/admin/manage",    icon: Search},
  { title: "Riders", url: "/admin/riders", icon: Users },
  { title: "Fleet", url: "/admin/fleet", icon: Car },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { title: "Areas",      url: "/admin/areas",     icon: MapPin},
  { title: "Pricing", url: "/admin/pricing", icon: DollarSign },
  { title: "Earnings",  url: "/admin/earnings",    icon: BadgeDollarSign  },
];

const countries = [
  { name: "Kenya", flag: "🇰🇪" },
  { name: "Uganda", flag: "🇺🇬" },
  { name: "Tanzania", flag: "🇹🇿" },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <NavLink to="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
            <Package className="h-4 w-4 text-secondary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-heading text-sm font-bold text-sidebar-foreground">Nation Courier</h2>
              <p className="text-[10px] text-muted-foreground">Dispatch Console</p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-secondary font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Regions</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-col gap-1 px-2">
                {countries.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground">
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                    
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <NavLink to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-3 w-3" />
            Back to Customer Portal
          </NavLink>
          
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
