import { 
  useListNotifications, 
  useMarkNotificationRead 
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getListNotificationsQueryKey } from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, Info, AlertTriangle, ShieldAlert, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();
  const { data, isLoading } = useListNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();

  const handleMarkRead = (id: number) => {
    markRead.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      }
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'exposure_alert': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'cluster_warning': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'outbreak_notice': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          {data?.unreadCount ? (
            <Badge variant="destructive" className="rounded-full px-2.5 text-sm">
              {data.unreadCount} new
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground">Important updates and health alerts.</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.notifications && data.notifications.length > 0 ? (
          data.notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all ${!notification.isRead ? 'border-primary shadow-sm bg-primary/5' : 'bg-card opacity-80'}`}
            >
              <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  !notification.isRead ? 'bg-background shadow-sm' : 'bg-muted'
                }`}>
                  {getIconForType(notification.type)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h3 className={`font-semibold text-lg ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${!notification.isRead ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                  
                  {notification.type !== 'general' && (
                    <div className="mt-3">
                      <Badge variant="outline" className="capitalize">
                        {notification.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </div>

                {!notification.isRead && !isDemo && (
                  <div className="flex-shrink-0 mt-4 sm:mt-0 self-start sm:self-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleMarkRead(notification.id)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark Read
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-12 bg-card rounded-lg border">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">You're all caught up</h3>
            <p className="text-muted-foreground mt-1">No notifications to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
