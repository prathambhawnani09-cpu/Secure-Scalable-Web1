import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  AlertCircle,
  Bell,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const { userRole, logout: clearAuth } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { enabled: !!userRole } });
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        clearAuth();
        setLocation("/login");
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["admin"] },
    { href: "/nurse", label: "Visit Log", icon: Stethoscope, roles: ["nurse", "admin"] },
    { href: "/visits", label: "All Visits", icon: Activity, roles: ["nurse", "admin"] },
    { href: "/alerts", label: "Alerts", icon: AlertCircle, roles: ["nurse", "admin"] },
    { href: "/students", label: "Students", icon: Users, roles: ["nurse", "admin"] },
    { href: "/notifications", label: "Notifications", icon: Bell, roles: ["nurse", "admin", "parent"] },
  ];

  const visibleNavItems = navItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/">
            <div className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground cursor-pointer">
              <Activity className="h-6 w-6 text-sidebar-primary" />
              SchoolHealth AI
            </div>
          </Link>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {visibleNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium text-sidebar-foreground">{user?.name || "Loading..."}</div>
              <div className="text-sidebar-foreground/70 capitalize">{userRole}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
