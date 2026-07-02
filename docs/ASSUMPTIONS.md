# Assumptions

1. **Single store initially** — Schema supports multi-store via `storeId` FK, but MVP UI assumes one store per user.

2. **Expected quantity source** — `products.expectedQty` is the system-of-record for expected count. No live POS integration in v1.

3. **One count line per product+location+session** — Unique constraint prevents duplicate entries; increment mode adds to existing count.

4. **Last-write-wins sync** — Offline conflicts resolved by applying most recent client timestamp with audit trail, not merge UI.

5. **JWT in SecureStore** — Mobile tokens stored in Expo SecureStore (Keychain/Keystore).

6. **Network detection** — Uses `expo-network` for online/offline status; no background fetch in v1.

7. **Barcode formats** — Supports EAN-13, EAN-8, UPC-A/E, Code 128, Code 39.

8. **Restricted thresholds** — Fixed at 2 units or 5% variance for alcohol/tobacco (configurable in future).

9. **No product CRUD on mobile** — Product management is owner-only via API; mobile caches read-only catalog.

10. **Password auth only** — No SSO/OAuth in MVP; suitable for small team with shared store credentials policy.

11. **English UI only** — No i18n in v1, though product names include Indian grocery items.

12. **PostgreSQL required** — SQLite is mobile-only; backend requires PostgreSQL (not SQLite).

13. **Development HTTP** — API runs HTTP locally; production requires HTTPS reverse proxy.

14. **Expo managed workflow** — No ejected native code; camera/barcode via expo-camera.

15. **Audit immutability** — Audit events are append-only; no delete/update endpoints.
