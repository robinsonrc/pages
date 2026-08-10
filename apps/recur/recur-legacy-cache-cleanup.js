self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("recur-runtime-v1"));
});
