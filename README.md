# RBT Manager

iPad-friendly point-of-sale and business manager for retail shops.

## Features

- **Customizable home dashboard** — movable, resizable, hideable widgets (signature feature)
- **Touch POS** — category tabs, product photo grid with +/− quantity and Select, cart on the right (~80/20)
- **Configurable TVA** — default 16%, changeable in Settings
- **Cash / card confirmation** — no payment terminal required; invoices with shop branding
- **Guest + customer accounts** — automatic professional discounts at checkout
- **Inventory** — photos, categories, stock status
- **Sales reports** — day / week / month / year with excl. TVA, TVA, and totals
- **Calendar** — staff schedules, pickups, deliveries, tasks
- **Supplier orders** — Ordered → On the way → Arrived → In store timeline
- **Appearance** — light / dark / custom themes, live preview, logo everywhere

## Run locally

```bash
npm install
npm run dev
```

Open on an iPad browser (Safari) or desktop. Demo staff PINs: owner `1234`, Amina `2222`, Jean `3333`.

Data persists in the browser (`localStorage`).

## Build

```bash
npm run build
npm run preview
```
