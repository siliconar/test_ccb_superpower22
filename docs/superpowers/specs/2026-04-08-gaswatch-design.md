# Global Methane Emission Monitoring Website — Design Specification

**Date**: 2026-04-08  
**Project**: GasWatch  
**Tech Stack**: Angular 21 (standalone, zoneless) + Tailwind CSS v4 + MapLibre GL + Go + SQLite

---

## 1. Overview

A web-based platform for visualizing satellite-detected greenhouse gas plume data (CH4, CO, NO2). Supports desktop, tablet, and mobile browsers.

**Core capabilities**:
1. Display emission monitoring results for multiple gas types
2. Multi-level data visualization based on map zoom
3. View emission points, clusters, and plume details
4. Public landing page + interactive map application
5. Filter by satellite, date range, flux rate, gas type, sector

---

## 2. Site Structure

**Two separate pages**:
- `/` — Public landing page (hero, stats, gas types, latest detections, about)
- `/map` — Full-screen map application (no persistent nav bar)

**Routing**:
```
/              → LandingComponent (lazy-loaded)
/map           → MapComponent (lazy-loaded)
/map?id=<id>   → MapComponent with plume pre-selected
```

---

## 3. Visual Style

**Theme**: Neutral Slate Dark

| Purpose | Color |
|---------|-------|
| Page background | `#0f172a` |
| Card/panel background | `#1e293b` |
| Border | `#334155` |
| Primary text | `#e2e8f0` |
| Secondary text | `#94a3b8` |
| CH4 accent | `#fb923c` (orange) |
| CO accent | `#f87171` (red) |
| NO2 accent | `#818cf8` (indigo) |
| Primary button | `#3b82f6` (blue) |

---

## 4. Architecture

**Approach B: Service Abstraction Layer**

```
gas-frontend/
├── src/app/
│   ├── core/
│   │   ├── models/              # TypeScript interfaces
│   │   └── services/
│   │       ├── plume.service.ts         # abstract interface
│   │       ├── mock-plume.service.ts    # reads assets/mock/*.json
│   │       └── api-plume.service.ts     # calls Go REST API
│   ├── features/
│   │   ├── landing/             # public landing page
│   │   └── map/                 # full-screen map app
│   └── shared/                  # reusable UI components
├── src/assets/mock/             # mock JSON data files
└── src/environments/            # environment.ts (useMock flag)

gas-backend/
├── cmd/server/main.go
├── internal/
│   ├── handler/                 # HTTP handlers
│   ├── repository/              # SQLite queries
│   └── model/                   # Go structs
└── data/gas.db                  # SQLite database
```

**Key principle**: Components only depend on the abstract `PlumeService` interface. `environment.useMock` controls which implementation is injected. Switching to real API = change one flag.

---

## 5. Data Models

### 5.1 Plume

```typescript
export interface Plume {
  id: string;
  satellite: string;
  payload: string;
  productLevel: string;
  overpassTime: Date;
  longitude: number;
  latitude: number;
  country: string;
  sector: string;
  gasType: 'CH4' | 'CO' | 'NO2';
  fluxRate: number;           // kg/h
  fluxRateStd: number;
  windU: number;
  windV: number;
  windSpeed: number;
  detectionInstitution: string;
  quantificationInstitution: string;
  feedbackOperator: string;
  feedbackGovernment: string;
  additionalInformation: string;
  sharedOrganization: string;
  geometry: GeoJSON.Polygon;
  tiffUrl?: string;
}
```

### 5.2 FilterCriteria

```typescript
export interface FilterCriteria {
  gasTypes: string[];
  satellites: string[];
  dateRange: { start: Date; end: Date };
  sectors?: string[];
  fluxRateRange?: { min: number; max: number };  // kg/h
}
```

### 5.3 Stats

```typescript
export interface Stats {
  totalDetections: number;
  countriesCount: number;
  gasTypesCount: number;
  latestDetectionDate: Date;
}
```

---

## 6. Service Layer

```typescript
// plume.service.ts (abstract interface)
export abstract class PlumeService {
  abstract getPlumes(filter: FilterCriteria): Observable<Plume[]>;
  abstract getPlumeById(id: string): Observable<Plume>;
  abstract getStats(): Observable<Stats>;
}

// mock-plume.service.ts
@Injectable()
export class MockPlumeService extends PlumeService {
  getPlumes(filter: FilterCriteria): Observable<Plume[]> {
    return this.http.get<Plume[]>('assets/mock/plumes.json').pipe(
      map(plumes => this.applyFilter(plumes, filter))
    );
  }
}

// api-plume.service.ts
@Injectable()
export class ApiPlumeService extends PlumeService {
  getPlumes(filter: FilterCriteria): Observable<Plume[]> {
    const params = this.buildQueryParams(filter);
    return this.http.get<Plume[]>(`${environment.apiUrl}/api/plumes`, { params });
  }
}
```

**Environment toggle**:
```typescript
// environment.ts
export const environment = {
  production: false,
  useMock: true,
  apiUrl: 'http://localhost:8080'
};

// app.config.ts
{
  provide: PlumeService,
  useClass: environment.useMock ? MockPlumeService : ApiPlumeService
}
```

**Transition to real API**: Set `useMock: false`, zero component changes.

---

## 7. Landing Page

**Section order** (top to bottom):

1. **Nav bar** — sticky, logo + "Open Map →" CTA, `bg-slate-900/80 backdrop-blur`
2. **Hero** — full viewport height, dark background with CSS particle animation, large headline, "Open Map" button
3. **Stats Bar** — 4 animated counters (total detections, countries, gas types, latest detection date), count-up animation on scroll (`IntersectionObserver`), data from `PlumeService.getStats()`
4. **Gas Types** — 3 cards (CH4, CO, NO2), each with icon, name, description
5. **Latest Detections** — grid of 10 most recent plume cards, each with gas badge, flux rate, country, satellite, date, "View on Map →" link to `/map?id=<id>`
6. **About** — mission statement, detection institution credit
7. **Footer** — brand, data source, year

**Responsive**:
- Mobile: single column, hero height reduced
- Tablet: 2-column grid for gas types and latest detections
- Desktop: 3-column grid

---

## 8. Map Page

### 8.1 Layout

- Full-screen MapLibre map (`position: absolute; inset: 0`)
- Slim top nav bar (brand + "← Home")
- **Floating filter panel** (top-left, collapsible to pill)
- **Floating detail drawer** (right edge, slides in on marker click)

### 8.2 Map Visualization

**Data source**: GeoJSON FeatureCollection from `PlumeService.getPlumes(filter)`.

**Cluster** (MapLibre built-in, proximity-based):
- Circle size ∝ `point_count` (small ≤5, medium ≤20, large 20+)
- Color = dominant gas type (CH4: `#fb923c`, CO: `#f87171`, NO2: `#818cf8`)
- Count badge rendered as symbol layer on top
- Click → `map.flyTo()` + zoom in → cluster auto-splits

**Individual Marker** (isolated point):
- Two concentric circles: outer glow (low opacity) + inner solid dot
- Color = gas type
- Click → trigger plume overlay + open detail drawer

**Plume Overlay** (on marker click):
- `line` layer: dashed polygon outline (from GeoJSON geometry)
- `fill` layer: transparent base
- TIFF heatmap: `GeoTIFF.js` parses pixel values → renders via MapLibre canvas layer
- Hover → tooltip shows concentration value at cursor
- Click elsewhere / close drawer → remove overlay layers

### 8.3 Filter Panel

- Default: collapsed pill showing active filter count badge
- Expanded: gas type checkboxes, satellite dropdown, date range inputs, flux rate range slider (kg/h)
- "Apply" button triggers `getPlumes()` → map data refreshes

### 8.4 Detail Drawer

- CSS `transform: translateX()` slide-in animation
- Top: plume polygon thumbnail (mini canvas)
- Displays all `Plume` fields in structured layout
- Close button + click elsewhere to close

**Responsive**:
- Mobile: detail drawer becomes bottom sheet
- Tablet/desktop: right-side drawer

---

## 9. Mock Data Strategy

**Mock data file** (`assets/mock/plumes.json`):
- ~20–30 synthetic plume records covering different gas types, countries, flux rates
- Generated from existing `A0000092` template

**Mock TIFF handling**:
- All mock plumes share the same `A0000092_PLUME.tif` file
- `tiffUrl` points to `assets/mock/plumes/A0000092_PLUME.tif`
- `GeoTIFF.js` parses TIFF client-side → renders heatmap via MapLibre canvas layer

**Transition to real API**:
1. Set `useMock: false` in `environment.ts`
2. Ensure Go API returns same JSON shape as `Plume` interface
3. Done — zero component changes

---

## 10. Go Backend (Future)

**API endpoints**:
```
GET /api/plumes                  # supports gasType, dateFrom, dateTo, fluxMin, fluxMax, satellite, sector
GET /api/plumes/:id
GET /api/plumes/:id/tiff         # returns TIFF file
GET /api/stats
```

**SQLite `plumes` table**:
```sql
CREATE TABLE plumes (
  id TEXT PRIMARY KEY,
  raw_json TEXT NOT NULL,        -- full _META.json GeoJSON Feature
  geometry TEXT NOT NULL,        -- GeoJSON Polygon
  tiff_path TEXT NOT NULL,       -- relative path, e.g. data/rawdata/A0000092/A0000092_PLUME.tif
  gas_type TEXT,
  satellite TEXT,
  overpass_time TEXT,
  flux_rate REAL,
  country TEXT,
  sector TEXT
);
CREATE INDEX idx_gas_type ON plumes(gas_type);
CREATE INDEX idx_overpass_time ON plumes(overpass_time);
CREATE INDEX idx_flux_rate ON plumes(flux_rate);
```

**TIFF serving**: `GET /api/plumes/:id/tiff` reads from `tiff_path` → returns file.

---

## 11. Error Handling

| Scenario | Handling |
|----------|----------|
| `getPlumes()` fails | Toast notification "Failed to load data" + retry button |
| `getPlumeById()` fails | Error state in detail drawer |
| TIFF load fails | Show polygon outline only (no heatmap), log warning |
| Network timeout | Retry with exponential backoff |

**Loading states**:
- Map: skeleton loader overlay while fetching
- Detail drawer: spinner while loading
- Landing stats: placeholder → animate in

---

## 12. Testing

**Unit tests** (Vitest):
- Service layer (mock/API implementations)
- Filter logic
- Data transformations (Plume → GeoJSON)

**Component tests**:
- Filter panel emits correct events
- Detail drawer displays plume data correctly

**E2E** (optional, later): Playwright for critical flows (landing → map → click plume → detail drawer)

**Responsive testing**: mobile (375px), tablet (768px), desktop (1440px)

---

## 13. Component Structure

```
features/landing/
  ├── landing.component.ts       # container
  ├── hero/hero.component.ts
  ├── stats-bar/stats-bar.component.ts
  ├── gas-types/gas-types.component.ts
  ├── latest-detections/latest-detections.component.ts
  └── about/about.component.ts

features/map/
  ├── map.component.ts           # container, holds MapLibre instance
  ├── filter-panel/filter-panel.component.ts
  ├── detail-drawer/detail-drawer.component.ts
  └── plume-overlay/plume-overlay.component.ts  # renders heatmap
```

---

## 14. Map Tile Basemap

**Tile server**: mbtileserver running at `http://localhost:7777`
- Tileset ID: `vector`
- Format: `pbf` (vector tiles)
- TileJSON: `http://localhost:7777/services/vector/tilejson.json` (fetch on map init for zoom range + bounds)
- Tile URL pattern: `http://localhost:7777/services/vector/tiles/{z}/{x}/{y}.pbf`

**MapLibre style source config**:
```typescript
{
  version: 8,
  sources: {
    basemap: {
      type: 'vector',
      url: 'http://localhost:7777/services/vector/tilejson.json',
    }
  },
  layers: [
    // vector style layers (background, landuse, water, roads, labels…)
    // source-layer names resolved from TileJSON metadata at runtime
  ]
}
```

Plume GeoJSON sources and cluster/marker layers are added on top of the basemap after `map.on('load')`.

---

## 15. Dependencies

**Frontend**:
- `@angular/core` ^21.2.0
- `@angular/router` ^21.2.0
- `tailwindcss` ^4.1.12
- `maplibre-gl` (latest)
- `geotiff` (latest, for TIFF parsing)
- `vitest` ^4.0.8

**Backend** (future):
- Go 1.22+
- `github.com/mattn/go-sqlite3`
- `github.com/gorilla/mux` or `chi`

---

## 15. Implementation Notes

**Linus 三问**:
1. **这是现实问题还是想象问题？** → All features are driven by real user needs (view data, filter, inspect details)
2. **有没有更简单的做法？** → Service abstraction is the simplest way to support mock → real API transition
3. **会破坏什么？** → Mock → real API switch is backward-compatible (same interface)

**YAGNI**: No premature abstractions. Cluster logic uses MapLibre built-in. No custom state management (RxJS + Angular signals sufficient).

**Responsive-first**: Tailwind breakpoints from day 1. Filter panel and detail drawer adapt to mobile/tablet/desktop.

---

## 16. Success Criteria

- [ ] Landing page loads in <2s
- [ ] Map displays 1000+ plumes without lag
- [ ] Filter changes update map in <500ms
- [ ] Plume detail drawer opens in <300ms
- [ ] TIFF heatmap renders in <1s
- [ ] Works on Chrome, Firefox, Safari (desktop + mobile)
- [ ] Responsive on 375px, 768px, 1440px viewports
- [ ] Mock → real API switch requires only `environment.useMock` change

---

**End of Design Specification**
