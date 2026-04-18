import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const NAV_COLORS: Record<string, { active: string; icon: string }> = {
  "/dashboard": { active: "bg-indigo-600 text-white", icon: "text-indigo-300" },
  "/nurse":     { active: "bg-emerald-600 text-white", icon: "text-emerald-300" },
  "/visits":    { active: "bg-blue-600 text-white",   icon: "text-blue-300" },
  "/alerts":    { active: "bg-rose-600 text-white",   icon: "text-rose-300" },
  "/students":  { active: "bg-violet-600 text-white", icon: "text-violet-300" },
  "/health-records": { active: "bg-teal-600 text-white",  icon: "text-teal-300" },
  "/notifications":  { active: "bg-amber-500 text-white", icon: "text-amber-300" },
  "/resources": { active: "bg-sky-600 text-white",   icon: "text-sky-300" },
};

export function Layout({ children }: { children: ReactNode }) {
  const { userRole, userName, logout: clearAuth } = useAuth();
  const [location, setLocation] = useLocation();
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
    { href: "/dashboard",       label: "Overview",       icon: LayoutDashboard, roles: ["admin"] },
    { href: "/nurse",           label: "Visit Log",      icon: Stethoscope,     roles: ["nurse", "admin"] },
    { href: "/visits",          label: "All Visits",     icon: Activity,        roles: ["nurse", "admin"] },
    { href: "/alerts",          label: "Alerts",         icon: AlertCircle,     roles: ["nurse", "admin"] },
    { href: "/students",        label: "Students",       icon: Users,           roles: ["nurse", "admin"] },
    { href: "/health-records",  label: "Health Records", icon: ClipboardList,   roles: ["parent", "student"] },
    { href: "/notifications",   label: "Notifications",  icon: Bell,            roles: ["nurse", "admin", "parent", "student"] },
    { href: "/resources",       label: "Resources",      icon: BookOpen,        roles: ["parent", "student"] },
  ];

  const visibleNavItems = navItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  const displayName = userName || (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "User");
  const roleLabel = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-gray-950">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">SymptomSense</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = location === item.href;
            const colors = NAV_COLORS[item.href] ?? { active: "bg-white/20 text-white", icon: "text-white/70" };
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-sm font-medium ${
                    isActive
                      ? `${colors.active} shadow-sm`
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-white/50"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{displayName}</div>
              <div className="text-xs text-white/50">{roleLabel}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0 h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-background">
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
