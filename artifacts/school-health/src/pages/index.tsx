import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function IndexPage() {
  const { token, userRole } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token || !userRole) {
      setLocation("/login");
    } else if (userRole === "nurse") {
      setLocation("/nurse");
    } else if (userRole === "admin") {
      setLocation("/dashboard");
    } else if (userRole === "parent") {
      setLocation("/notifications");
    } else {
      setLocation("/login");
    }
  }, [token, userRole, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-primary mb-4"></div>
        <div className="text-muted-foreground">Loading SchoolHealth AI...</div>
      </div>
    </div>
  );
}
