import { useState } from "react";
import { format } from "date-fns";
import {
  useListAlerts,
  useResolveAlert,
  ListAlertsStatus
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListAlertsQueryKey } from "@workspace/api-client-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, AlertTriangle, CheckCircle2, Eye, EyeOff, KeyRound, Lock, MapPin, Users, Loader2, ShieldAlert } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<ListAlertsStatus>("active");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolvePassword, setResolvePassword] = useState("");
  const [resolveCode, setResolveCode] = useState("");
  const [showResolvePassword, setShowResolvePassword] = useState(false);
  const [showResolveCode, setShowResolveCode] = useState(false);
  const [resolveAuthError, setResolveAuthError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const { userEmail } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListAlerts({ status: statusFilter });
  const resolveAlert = useResolveAlert();

  const handleResolveClick = (id: number) => {
    setSelectedAlertId(id);
    setResolveNote("");
    setResolvePassword("");
    setResolveCode("");
    setResolveAuthError("");
    setResolveDialogOpen(true);
  };

  const submitResolve = async () => {
    if (!selectedAlertId) return;
    setResolveAuthError("");

    if (resolveCode !== "admin222") {
      setResolveAuthError("Incorrect admin code.");
      return;
    }

    if (!resolvePassword) {
      setResolveAuthError("Please enter your password.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: resolvePassword }),
      });
      if (!res.ok) {
        setResolveAuthError("Incorrect password. Please try again.");
        setVerifying(false);
        return;
      }
    } catch {
      setResolveAuthError("Could not verify credentials. Check your connection.");
      setVerifying(false);
      return;
    }
    setVerifying(false);

    resolveAlert.mutate(
      { id: selectedAlertId, data: { note: resolveNote || "Resolved by admin" } },
      {
        onSuccess: () => {
          toast({
            title: "Alert Resolved",
            description: "The alert has been marked as resolved.",
          });
          setResolveDialogOpen(false);
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to resolve alert. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'low': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'low': return <AlertCircle className="h-5 w-5 text-primary" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const formatType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const isSubmitDisabled = verifying || resolveAlert.isPending || !resolvePassword || !resolveCode;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Alerts</h1>
        <p className="text-muted-foreground">Automated health cluster and outbreak warnings.</p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ListAlertsStatus)}>
          <TabsList>
            <TabsTrigger value="active">Active Alerts</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {data && (
          <div className="text-sm text-muted-foreground">
            Showing {data.alerts.length} {statusFilter} alerts
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))
        ) : data?.alerts && data.alerts.length > 0 ? (
          data.alerts.map((alert) => (
            <Card key={alert.id} className={alert.status === 'active' ? 'border-l-4 border-l-destructive shadow-sm' : 'opacity-80'}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {alert.status === 'active' ? getSeverityIcon(alert.severity) : <CheckCircle2 className="h-5 w-5 text-success" />}
                    <CardTitle className="text-xl">{alert.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getSeverityColors(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    {alert.status === 'resolved' && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        RESOLVED
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {alert.affectedClassroom || alert.affectedGrade || 'Campus Wide'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {alert.affectedCount} students affected
                  </span>
                  <span>{format(new Date(alert.createdAt), "MMM d, h:mm a")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-foreground mb-4">{alert.description}</p>
                <div className="flex flex-wrap gap-2">
                  {alert.symptoms.map((symptom, i) => (
                    <Badge key={i} variant="secondary">
                      {symptom}
                    </Badge>
                  ))}
                </div>

                {alert.status === 'resolved' && alert.resolutionNote && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm border">
                    <div className="font-semibold mb-1 text-foreground">Resolution Note (by {alert.resolvedBy})</div>
                    <p className="text-muted-foreground">{alert.resolutionNote}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Resolved at {format(new Date(alert.resolvedAt!), "MMM d, h:mm a")}
                    </p>
                  </div>
                )}
              </CardContent>
              {alert.status === 'active' && (
                <CardFooter className="bg-muted/20 border-t pt-4">
                  <Button onClick={() => handleResolveClick(alert.id)}>
                    Mark as Resolved
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center p-12 bg-card rounded-lg border">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">All Clear</h3>
            <p className="text-muted-foreground mt-1">No {statusFilter} alerts found.</p>
          </div>
        )}
      </div>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Resolve Alert
            </DialogTitle>
            <DialogDescription>
              This action requires your admin password and access code to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="resolveNote">Resolution Note</Label>
              <Textarea
                id="resolveNote"
                placeholder="e.g., Deep cleaned classroom 3B, notified all parents, cases subsiding."
                className="min-h-[80px]"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Confirm your identity
              </p>

              <div className="space-y-2">
                <Label htmlFor="resolvePassword">Your Password</Label>
                <div className="relative">
                  <Input
                    id="resolvePassword"
                    type={showResolvePassword ? "text" : "password"}
                    placeholder="Enter your account password"
                    value={resolvePassword}
                    onChange={(e) => { setResolvePassword(e.target.value); setResolveAuthError(""); }}
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResolvePassword(!showResolvePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResolvePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolveCode" className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Admin Code
                </Label>
                <div className="relative">
                  <Input
                    id="resolveCode"
                    type={showResolveCode ? "text" : "password"}
                    placeholder="Enter the admin access code"
                    value={resolveCode}
                    onChange={(e) => { setResolveCode(e.target.value); setResolveAuthError(""); }}
                    className="pr-10"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResolveCode(!showResolveCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResolveCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {resolveAuthError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {resolveAuthError}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button onClick={submitResolve} disabled={isSubmitDisabled} variant="destructive">
              {(verifying || resolveAlert.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {verifying ? "Verifying…" : "Resolve Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
