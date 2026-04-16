self.addEventListener("fetch", (event) => {
  console.log("[Moments SW] fetch", event.request.method, event.request.url);
  event.respondWith(fetch(event.request));
});
