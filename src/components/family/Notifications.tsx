import { useEffect } from 'react';
import { useAppFamily } from '@/contexts/FamilyContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { TrashIcon } from '@radix-ui/react-icons';

export const Notifications = () => {
  const {
    loading,
    error,
    notifications,
    markNotificationsAsRead,
    deleteNotification
  } = useAppFamily();

  // Mark all notifications as read when component mounts
  useEffect(() => {
    if (notifications.length > 0) {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
      if (unreadIds.length > 0) {
        markNotificationsAsRead(unreadIds);
      }
    }
  }, [notifications, markNotificationsAsRead]);

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (notifications.length === 0) {
    return <div>No notifications</div>;
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card key={notification.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base">
                {notification.family?.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(notification.created_at)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p>{notification.message}</p>
                {notification.sender && (
                  <p className="text-sm text-muted-foreground">
                    From: {notification.sender.name}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(notification.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 