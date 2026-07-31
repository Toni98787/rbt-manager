# RBT Manager

iPad-first barbershop business platform for inventory, POS, customers, sales reports, calendar, and supplier orders.

## Features

- **Customizable home dashboard** — movable/resizable widgets (inventory, sales, staff, top products, reserved orders, calendar, suppliers, quick actions)
- **POS** — category tabs, photo product grid with +/- quantity and Select, side cart with TVA
- **Configurable TVA** — default 16%, editable in Settings
- **Payments** — confirm cash or card (no payment terminal integration)
- **PDF invoices** — client + shop copies, preview, download/print, email
- **Customers** — guest walk-ins + optional accounts with automatic discounts
- **Inventory** — categories, gallery photo import, stock receive
- **Sales reports** — day / week / month / year with ex-TVA, TVA, totals, best sellers
- **Calendar** — event types, notifications, staff-scoped view
- **Supplier orders** — Ordered → On the way → Arrived → In store timeline + receive stock
- **Appearance** — light / dark / custom themes, live preview, per-user prefs, shop logo branding

## Run on iPad

1. Start the app on a computer on the same network (or host it).
2. Open Safari on the iPad and go to the URL.
3. Share → **Add to Home Screen** for a full-screen app experience.
4. Use landscape orientation for the best POS layout.

## Demo staff PINs

| Staff  | PIN  | Notes                    |
|--------|------|--------------------------|
| Owner  | 1234 | Full access              |
| Alex   | 2222 | Staff, no discount override |
| Jordan | 3333 | Staff, can override discounts |

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

Data is stored in the browser (`localStorage`) so each iPad keeps its own local workspace unless you add a backend later.
