self.addEventListener("fetch", (event) => {
  console.log("[Moments SW] fetch", event.request.method, event.request.url);
  event.respondWith(fetch(event.request));
});

// ─── Push notification handling ──────────────────────────────────────────────

self.addEventListener("push", (event) => {
  console.log("[Moments SW] push event received");

  if (!event.data) {
    console.error("[Moments SW] No data in push event");
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new notification from Moments",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      image: data.image || undefined,
      actions: Array.isArray(data.actions) ? data.actions : undefined,
      tag: data.tag || "moments-notification",
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(data.title || "Moments", options));
  } catch (error) {
    console.error("[Moments SW] Error parsing push data:", error);
  }
});

// ─── Notification click handling ─────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  console.log("[Moments SW] notification clicked", event.notification.tag);
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
