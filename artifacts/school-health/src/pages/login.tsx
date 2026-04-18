import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, UserRole } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Bell,
  TrendingUp,
  Users,
  Stethoscope,
  UserCog,
  HeartHandshake,
  Sparkles,
  X,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    label: "Nurse",
    email: "nurse@demo.school",
    role: "School Nurse",
    icon: Stethoscope,
    color: "bg-emerald-500",
    hoverColor: "hover:bg-emerald-600",
    ring: "ring-emerald-300",
  },
  {
    label: "Admin",
    email: "admin@demo.school",
    role: "Administrator",
    icon: UserCog,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    ring: "ring-blue-300",
  },
  {
    label: "Parent",
    email: "parent@demo.school",
    role: "Parent / Guardian",
    icon: HeartHandshake,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
    ring: "ring-purple-300",
  },
];

const STATS = [
  { value: "2.4M+", label: "Student visits tracked" },
  { value: "98%", label: "Outbreak detection accuracy" },
  { value: "<2min", label: "Average alert time" },
];

const FEATURES = [
  { icon: ShieldCheck, text: "AI-powered symptom cluster detection" },
  { icon: Bell, text: "Instant parent & admin alerts" },
  { icon: TrendingUp, text: "Real-time health trend analytics" },
  { icon: Users, text: "Multi-role access for nurses & staff" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoHint, setDemoHint] = useState<string | null>(null);
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
          setAuth(data.token, data.user.role as UserRole, data.user.name, data.user.email);
          if (data.user.role === "nurse") setLocation("/nurse");
          else if (data.user.role === "admin") setLocation("/dashboard");
          else if (data.user.role === "parent") setLocation("/health-records");
          else setLocation("/health-records");
        },
      }
    );
  };

  const handleDemoLogin = (demoEmail: string, roleLabel: string) => {
    setDemoOpen(false);
    setDemoHint(roleLabel);
    setEmail(demoEmail);
    setPassword("password123");

    login.mutate(
      { data: { email: demoEmail, password: "password123" } },
      {
        onSuccess: (data) => {
          setAuth(data.token, data.user.role as UserRole, data.user.name, data.user.email);
          if (data.user.role === "nurse") setLocation("/nurse");
          else if (data.user.role === "admin") setLocation("/dashboard");
          else if (data.user.role === "parent") setLocation("/health-records");
          else setLocation("/health-records");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #0f4c75 0%, #1b6ca8 40%, #0e7c61 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">SchoolHealth AI</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Protect your students.<br />
            Detect outbreaks early.
          </h1>
          <p className="text-white/70 text-lg max-w-sm">
            Real-time illness intelligence that keeps schools safe — before an outbreak spreads.
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-white/60 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">SchoolHealth AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your school health dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@yourschool.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setDemoHint(null); }}
                required
                className="h-11"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {demoHint && (
                <p className="text-xs text-emerald-600 font-medium">
                  Signing in as {demoHint}…
                </p>
              )}
            </div>

            {login.isError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Invalid email or password. Please try again.
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={login.isPending}
            >
              {login.isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setLocation("/signup")}
                className="text-primary hover:underline font-semibold"
              >
                Create account
              </button>
            </p>
          </div>
        </div>

        {/* Floating bubble demo menu */}
        <div className="fixed bottom-8 right-8 flex flex-col items-end gap-3 z-50">
          {/* Demo account bubbles — slide up when open */}
          <div
            className={`flex flex-col items-end gap-3 transition-all duration-300 ${
              demoOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            {DEMO_ACCOUNTS.map(({ label, email: demoEmail, role, icon: Icon, color, hoverColor, ring }) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => handleDemoLogin(demoEmail, role)}
                className={`flex items-center gap-3 ${color} ${hoverColor} text-white rounded-full pl-4 pr-5 py-2.5 shadow-lg ring-2 ${ring} ring-offset-2 transition-all duration-200 hover:scale-105 active:scale-95`}
              >
                <div className="h-7 w-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold leading-tight">{label}</div>
                  <div className="text-xs opacity-75 leading-tight">{demoEmail}</div>
                </div>
              </button>
            ))}

            <p className="text-xs text-muted-foreground text-right pr-1">
              All use password: <code className="font-mono bg-muted px-1 py-0.5 rounded">password123</code>
            </p>
          </div>

          {/* Main FAB toggle button */}
          <button
            type="button"
            onClick={() => setDemoOpen((o) => !o)}
            className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ring-2 ring-offset-2 ${
              demoOpen
                ? "bg-slate-700 hover:bg-slate-800 ring-slate-400 rotate-180"
                : "bg-primary hover:bg-primary/90 ring-primary/40 hover:scale-110"
            }`}
            title="Try a demo account"
          >
            {demoOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Sparkles className="h-6 w-6 text-white" />
            )}
          </button>

          {!demoOpen && (
            <span className="text-xs text-muted-foreground font-medium -mt-1">Try demo</span>
          )}
        </div>
      </div>
    </div>
  );
}
