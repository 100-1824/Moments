import { useEffect, useRef, useState } from "react";
import { subscribeToPushNotifications } from "../lib/api";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

interface UsePushNotificationsOptions {
  enabled?: boolean;
  requestOnEnable?: boolean;
}

/**
 * Hook to manage push notification subscription.
 * Automatically subscribes when enabled.
 * Provides a manual subscribe function and permission status.
 */
export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { enabled = true, requestOnEnable = true } = options;
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const autoSubscribeAttemptedRef = useRef(false);

  // On native: listen for foreground push notifications and trigger haptic for pings
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cleanup: (() => void) | undefined;
    import("@capacitor/push-notifications").then(({ PushNotifications }) => {
      const handler = PushNotifications.addListener("pushNotificationReceived", async (notification) => {
        if (notification.data?.type === "ping") {
          await Haptics.notification({ type: NotificationType.Warning });
          await new Promise(r => setTimeout(r, 200));
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }
      });
      handler.then(h => { cleanup = () => h.remove(); });
    });
    return () => cleanup?.();
  }, []);

  // Check initial permission status
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Auto-subscribe when enabled.
  useEffect(() => {
    if (!enabled) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!permissionStatus) return;
    if (autoSubscribeAttemptedRef.current || isSubscribing) return;

    if (permissionStatus === "granted") {
      autoSubscribeAttemptedRef.current = true;
      void subscribeToNotifications();
      return;
    }

    if (permissionStatus === "default" && requestOnEnable) {
      autoSubscribeAttemptedRef.current = true;
      void subscribeToNotifications();
    }
  }, [enabled, isSubscribing, permissionStatus, requestOnEnable]);

  const subscribeToNotifications = async () => {
    if (!enabled || isSubscribing) {
      return false;
    }

    try {
      setIsSubscribing(true);
      setSubscribeError(null);
      const success = await subscribeToPushNotifications();
      if ("Notification" in window) {
        setPermissionStatus(Notification.permission);
      }
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
