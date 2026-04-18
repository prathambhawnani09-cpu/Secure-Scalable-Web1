import { Link } from "wouter";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">404</h1>
          <p className="text-xl font-medium text-muted-foreground">Page not found</p>
          <p className="text-sm text-muted-foreground mt-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
