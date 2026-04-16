import { useEffect, useState } from "react";
import { subscribeToPushNotifications } from "../lib/api";

/**
 * Hook to manage push notification subscription.
 * Automatically subscribes when the app loads (if permission already granted).
 * Provides a manual subscribe function and permission status.
 */
export function usePushNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  // Check initial permission status
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Auto-subscribe if permission already granted
  useEffect(() => {
    if (permissionStatus === "granted" && "serviceWorker" in navigator) {
      subscribeToNotifications();
    }
  }, [permissionStatus]);

  const subscribeToNotifications = async () => {
    try {
      setIsSubscribing(true);
      setSubscribeError(null);
      const success = await subscribeToPushNotifications();
      if (success) {
        setPermissionStatus("granted");
      }
      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setSubscribeError(message);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  };

  return {
    permissionStatus,
    isSubscribing,
    subscribeError,
    subscribe: subscribeToNotifications,
    isSupported: "serviceWorker" in navigator && "PushManager" in window,
  };
}
