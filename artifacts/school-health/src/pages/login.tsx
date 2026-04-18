import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, UserRole } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setAuth } = useAuth();
  const [, setLocation] = useLocation();
  const login = useLogin();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) return;

    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          setAuth(data.token, data.user.role);
          if (data.user.role === "nurse") setLocation("/nurse");
          else if (data.user.role === "admin") setLocation("/dashboard");
          else if (data.user.role === "parent") setLocation("/notifications");
        },
      }
    );
  };

  const demoLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("pb042009");
    login.mutate(
      { data: { email: roleEmail, password: "pb042009" } },
      {
        onSuccess: (data) => {
          setAuth(data.token, data.user.role);
          if (data.user.role === "nurse") setLocation("/nurse");
          else if (data.user.role === "admin") setLocation("/dashboard");
          else if (data.user.role === "parent") setLocation("/notifications");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SchoolHealth AI</h1>
          <p className="text-muted-foreground mt-2">Real-time outbreak intelligence for schools</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nurse@demo.school"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {login.isError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Invalid credentials
                </div>
              )}

              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or use a demo account</span>
                </div>
              </div>

              <div className="grid gap-2 mt-4">
                <Button variant="outline" onClick={() => demoLogin("nurse@demo.school")}>
                  Nurse Demo
                </Button>
                <Button variant="outline" onClick={() => demoLogin("admin@demo.school")}>
                  Admin Demo
                </Button>
                <Button variant="outline" onClick={() => demoLogin("parent@demo.school")}>
                  Parent Demo
                </Button>
                <Button variant="outline" onClick={() => demoLogin("teacher@demo.school")}>
                  Teacher Demo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
