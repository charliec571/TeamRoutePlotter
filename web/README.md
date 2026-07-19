# Team Route Plotter (Web)

Mobile-first web app for competition route planning. Map a shared set of points once, then give each group a different order through those same stops.

## Flow

1. Create a **competition**
2. **Map points** — long-press to add shared areas of interest
3. Add **groups** — each gets a shuffled order of the same points
4. Drag to fine-tune a group’s route, then **share** Google Maps links

Data is saved in the browser (`localStorage`).

## Run locally

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173` (use `npm run dev -- --host` to try on a phone).

## Build

```bash
cd web
npm run build
npm run preview
```
