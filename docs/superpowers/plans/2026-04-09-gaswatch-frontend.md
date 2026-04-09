# GasWatch Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the GasWatch frontend: a public landing page + full-screen MapLibre map app for visualizing greenhouse gas plume data.

**Architecture:** Angular 21 standalone/zoneless with a service abstraction layer — components only depend on the abstract `PlumeService`; `environment.useMock` controls whether mock JSON or real API is used. Landing page (`/`) and map page (`/map`) are lazy-loaded routes.

**Tech Stack:** Angular 21 (standalone, signals, OnPush), Tailwind CSS v4, MapLibre GL v5, GeoTIFF.js v3, Vitest (via `@angular/build:unit-test`), TypeScript strict

---

## Existing Foundation (DO NOT RECREATE)

These files already exist and are complete — read them to understand types/APIs:
- `src/app/core/models/plume.model.ts` — `Plume`, `FilterCriteria`, `Stats`, `GasType`, `GAS_COLORS`, `DEFAULT_FILTER`
- `src/app/core/services/plume.service.ts` — abstract `PlumeService`
- `src/app/core/services/mock-plume.service.ts` — `MockPlumeService`
- `src/app/core/services/api-plume.service.ts` — `ApiPlumeService`
- `src/environments/environment.ts` — `{ production, useMock, apiUrl }`
- `src/assets/mock/plumes.json` — 20 synthetic plume records
- `src/styles.css` — contains `@import 'tailwindcss'`

---

## File Structure

**Modified:**
- `src/app/app.ts` — clean root component (router-outlet only)
- `src/app/app.html` — minimal template
- `src/app/app.css` — clear
- `src/app/app.routes.ts` — lazy routes for `/` and `/map`
- `src/app/app.config.ts` — add `provideHttpClient()` + `PlumeService` DI

**Created — Landing:**
- `src/app/features/landing/landing.component.ts` — container with nav + footer
- `src/app/features/landing/landing.component.html`
- `src/app/features/landing/hero/hero.component.ts` + `.html`
- `src/app/features/landing/stats-bar/stats-bar.component.ts` + `.html`
- `src/app/features/landing/gas-types/gas-types.component.ts` + `.html`
- `src/app/features/landing/latest-detections/latest-detections.component.ts` + `.html`
- `src/app/features/landing/about/about.component.ts` + `.html`

**Created — Map:**
- `src/app/features/map/map.component.ts` — MapLibre container, plume source/cluster/markers
- `src/app/features/map/map.component.html`
- `src/app/features/map/filter-panel/filter-panel.component.ts` + `.html`
- `src/app/features/map/detail-drawer/detail-drawer.component.ts` + `.html`
- `src/app/features/map/plume-overlay/plume-overlay.component.ts`

**Tests:**
- `src/app/features/landing/landing.component.spec.ts`
- `src/app/features/landing/stats-bar/stats-bar.component.spec.ts`
- `src/app/features/landing/latest-detections/latest-detections.component.spec.ts`
- `src/app/features/map/map.component.spec.ts`
- `src/app/features/map/filter-panel/filter-panel.component.spec.ts`
- `src/app/features/map/detail-drawer/detail-drawer.component.spec.ts`

---

## Task 1: App Shell — Routes, DI, Clean Root Component

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.config.ts`
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`
- Modify: `src/app/app.css`

- [ ] **Step 1: Update app.routes.ts**

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'map',
    loadComponent: () =>
      import('./features/map/map.component').then(m => m.MapComponent),
  },
  { path: '**', redirectTo: '' },
];
```

- [ ] **Step 2: Update app.config.ts**

```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { PlumeService } from './core/services/plume.service';
import { MockPlumeService } from './core/services/mock-plume.service';
import { ApiPlumeService } from './core/services/api-plume.service';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: PlumeService,
      useClass: environment.useMock ? MockPlumeService : ApiPlumeService,
    },
  ],
};
```

- [ ] **Step 3: Replace app.ts with clean root component**

```typescript
// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
```

- [ ] **Step 4: Clear app.html and app.css**

`src/app/app.html` — delete this file (the component uses inline template above, so this file is no longer needed). Or leave it empty:

```html
<!-- src/app/app.html -->
```

`src/app/app.css` — leave empty (or delete).

- [ ] **Step 5: Create placeholder landing component (so routing works)**

Create `src/app/features/landing/landing.component.ts`:

```typescript
// src/app/features/landing/landing.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  template: '<p>Landing placeholder</p>',
})
export class LandingComponent {}
```

- [ ] **Step 6: Create placeholder map component (so routing works)**

Create `src/app/features/map/map.component.ts`:

```typescript
// src/app/features/map/map.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-map',
  template: '<p>Map placeholder</p>',
})
export class MapComponent {}
```

- [ ] **Step 7: Run tests to verify shell works**

```bash
cd gas-frontend && ng test --include="src/app/app.spec.ts"
```

Expected: The existing `app.spec.ts` tests will fail because they look for `<h1>Hello, gas-frontend</h1>`. That's OK — update the test to match the new clean component:

```typescript
// src/app/app.spec.ts
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```

Run: `cd gas-frontend && ng test --include="src/app/app.spec.ts"`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
cd gas-frontend && git add src/app/app.ts src/app/app.html src/app/app.css src/app/app.routes.ts src/app/app.config.ts src/app/app.spec.ts src/app/features/landing/landing.component.ts src/app/features/map/map.component.ts
git commit -m "feat: 初始化应用路由和依赖注入配置"
```

---

## Task 2: Landing Container — Nav Bar + Layout Scaffolding

**Files:**
- Modify: `src/app/features/landing/landing.component.ts`
- Create: `src/app/features/landing/landing.component.html`
- Create: `src/app/features/landing/landing.component.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/landing/landing.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { provideRouter } from '@angular/router';
import { PlumeService } from '../../core/services/plume.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockPlumeService } from '../../core/services/mock-plume.service';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlumeService, useClass: MockPlumeService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LandingComponent);
  });

  it('should render nav bar with GasWatch logo and CTA', async () => {
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('nav')).toBeTruthy();
    expect(el.textContent).toContain('GasWatch');
    expect(el.querySelector('a[routerLink="/map"]')).toBeTruthy();
  });

  it('should render footer', async () => {
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('footer')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/landing.component.spec.ts"
```

Expected: FAIL — LandingComponent has no nav or footer

- [ ] **Step 3: Implement LandingComponent with nav + sub-components**

```typescript
// src/app/features/landing/landing.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroComponent } from './hero/hero.component';
import { StatsBarComponent } from './stats-bar/stats-bar.component';
import { GasTypesComponent } from './gas-types/gas-types.component';
import { LatestDetectionsComponent } from './latest-detections/latest-detections.component';
import { AboutComponent } from './about/about.component';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, HeroComponent, StatsBarComponent, GasTypesComponent, LatestDetectionsComponent, AboutComponent],
  templateUrl: './landing.component.html',
  styles: [],
})
export class LandingComponent {}
```

```html
<!-- src/app/features/landing/landing.component.html -->
<!-- Nav Bar -->
<nav class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
  <span class="text-xl font-bold text-slate-100 tracking-tight">GasWatch</span>
  <a routerLink="/map"
     class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
    Open Map →
  </a>
</nav>

<!-- Page Sections -->
<app-hero />
<app-stats-bar />
<app-gas-types />
<app-latest-detections />
<app-about />

<!-- Footer -->
<footer class="bg-slate-900 border-t border-slate-800 px-6 py-8 text-center text-slate-500 text-sm">
  <p class="font-semibold text-slate-300 mb-1">GasWatch</p>
  <p>Satellite-detected greenhouse gas emissions · Data sourced from SITP / Chinese Academy of Sciences</p>
  <p class="mt-2">© {{ currentYear }}</p>
</footer>
```

Add `currentYear` to the component class:

```typescript
// Update landing.component.ts — add to class body:
readonly currentYear = new Date().getFullYear();
```

- [ ] **Step 4: Create stub sub-components** (so imports compile — full implementations come in later tasks)

Create these stub files:

```typescript
// src/app/features/landing/hero/hero.component.ts
import { Component } from '@angular/core';
@Component({ selector: 'app-hero', template: '<section id="hero"></section>' })
export class HeroComponent {}
```

```typescript
// src/app/features/landing/stats-bar/stats-bar.component.ts
import { Component } from '@angular/core';
@Component({ selector: 'app-stats-bar', template: '<section id="stats"></section>' })
export class StatsBarComponent {}
```

```typescript
// src/app/features/landing/gas-types/gas-types.component.ts
import { Component } from '@angular/core';
@Component({ selector: 'app-gas-types', template: '<section id="gas-types"></section>' })
export class GasTypesComponent {}
```

```typescript
// src/app/features/landing/latest-detections/latest-detections.component.ts
import { Component } from '@angular/core';
@Component({ selector: 'app-latest-detections', template: '<section id="latest"></section>' })
export class LatestDetectionsComponent {}
```

```typescript
// src/app/features/landing/about/about.component.ts
import { Component } from '@angular/core';
@Component({ selector: 'app-about', template: '<section id="about"></section>' })
export class AboutComponent {}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/landing.component.spec.ts"
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd gas-frontend
git add src/app/features/landing/
git commit -m "feat: 添加 Landing 页面容器及导航栏框架"
```

---

## Task 3: Hero Component

**Files:**
- Modify: `src/app/features/landing/hero/hero.component.ts`
- Create: `src/app/features/landing/hero/hero.component.html`

The hero uses a CSS-based particle animation (no JS needed — pure CSS `@keyframes`).

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/landing/hero/hero.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { HeroComponent } from './hero.component';
import { provideRouter } from '@angular/router';

describe('HeroComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render headline', () => {
    const fixture = TestBed.createComponent(HeroComponent);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Track the Invisible');
  });

  it('should have Open Map button linking to /map', () => {
    const fixture = TestBed.createComponent(HeroComponent);
    const btn = (fixture.nativeElement as HTMLElement).querySelector('a[routerLink="/map"]');
    expect(btn).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/hero/hero.component.spec.ts"
```

Expected: FAIL

- [ ] **Step 3: Implement HeroComponent**

```typescript
// src/app/features/landing/hero/hero.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.component.html',
})
export class HeroComponent {}
```

```html
<!-- src/app/features/landing/hero/hero.component.html -->
<section class="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
  <!-- CSS Particle background -->
  <div class="particles absolute inset-0 pointer-events-none" aria-hidden="true">
    @for (i of particleIndexes; track i) {
      <span class="particle"></span>
    }
  </div>

  <div class="relative z-10 text-center px-6 max-w-3xl mx-auto">
    <div class="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-slate-400 mb-6">
      <span class="w-2 h-2 rounded-full bg-orange-400 inline-block animate-pulse"></span>
      Live satellite monitoring
    </div>
    <h1 class="text-5xl md:text-7xl font-extrabold text-slate-100 leading-tight tracking-tight mb-6">
      Track the Invisible<br />
      <span class="text-orange-400">Gas Emissions</span>
    </h1>
    <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-xl mx-auto">
      Satellite-detected CH₄, CO, and NO₂ plumes from industrial sources around the world.
      Real-time monitoring for a cleaner planet.
    </p>
    <a routerLink="/map"
       class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-900/40">
      Open Map
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
      </svg>
    </a>
  </div>
</section>

<style>
  .particles {
    background: radial-gradient(ellipse at 50% 50%, #0f2044 0%, #0f172a 70%);
  }
  .particle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: #fb923c;
    border-radius: 50%;
    opacity: 0;
    animation: float-particle 8s infinite;
  }
  .particle:nth-child(odd) { background: #818cf8; }
  .particle:nth-child(3n) { background: #f87171; }
  @for $i from 1 through 40 {
    .particle:nth-child(#{$i}) {
      left: random(100) * 1%;
      top: random(100) * 1%;
      animation-delay: random(8000) * 1ms;
      animation-duration: (random(5) + 6) * 1s;
    }
  }
  @keyframes float-particle {
    0% { opacity: 0; transform: translateY(0); }
    20% { opacity: 0.6; }
    80% { opacity: 0.3; }
    100% { opacity: 0; transform: translateY(-60px); }
  }
</style>
```

Note: The `@for $i` SCSS syntax won't work in Angular plain CSS. Use a simpler approach with JS-generated particles:

```typescript
// src/app/features/landing/hero/hero.component.ts (final)
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styles: [`
    .particle {
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      opacity: 0;
      animation: float-particle linear infinite;
    }
    @keyframes float-particle {
      0% { opacity: 0; transform: translateY(20px); }
      20% { opacity: 0.5; }
      80% { opacity: 0.2; }
      100% { opacity: 0; transform: translateY(-80px); }
    }
  `],
})
export class HeroComponent {
  readonly particles = Array.from({ length: 40 }, (_, i) => ({
    left: `${(i * 2.5 + 1) % 100}%`,
    top: `${(i * 7.3 + 5) % 100}%`,
    delay: `${(i * 0.3) % 8}s`,
    duration: `${6 + (i % 5)}s`,
    color: i % 3 === 0 ? '#fb923c' : i % 3 === 1 ? '#818cf8' : '#f87171',
  }));
}
```

```html
<!-- src/app/features/landing/hero/hero.component.html -->
<section class="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden">
  <!-- Particle background -->
  <div class="absolute inset-0 pointer-events-none" aria-hidden="true"
       style="background: radial-gradient(ellipse at 50% 50%, #0f2044 0%, #0f172a 70%);">
    @for (p of particles; track p.left) {
      <span class="particle"
            [style.left]="p.left"
            [style.top]="p.top"
            [style.animationDelay]="p.delay"
            [style.animationDuration]="p.duration"
            [style.background]="p.color">
      </span>
    }
  </div>

  <div class="relative z-10 text-center px-6 max-w-3xl mx-auto">
    <div class="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-slate-400 mb-6">
      <span class="w-2 h-2 rounded-full bg-orange-400 inline-block animate-pulse"></span>
      Live satellite monitoring
    </div>
    <h1 class="text-5xl md:text-7xl font-extrabold text-slate-100 leading-tight tracking-tight mb-6">
      Track the Invisible<br />
      <span class="text-orange-400">Gas Emissions</span>
    </h1>
    <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-xl mx-auto">
      Satellite-detected CH₄, CO, and NO₂ plumes from industrial sources worldwide.
      Real-time monitoring for a cleaner planet.
    </p>
    <a routerLink="/map"
       class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-900/40">
      Open Map →
    </a>
  </div>
</section>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/hero/hero.component.spec.ts"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd gas-frontend
git add src/app/features/landing/hero/
git commit -m "feat: 实现 Hero 区块组件（粒子动画背景）"
```

---

## Task 4: Stats Bar Component

Displays 4 animated counters. Uses `IntersectionObserver` to trigger count-up animation when scrolled into view.

**Files:**
- Modify: `src/app/features/landing/stats-bar/stats-bar.component.ts`
- Create: `src/app/features/landing/stats-bar/stats-bar.component.html`
- Create: `src/app/features/landing/stats-bar/stats-bar.component.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/landing/stats-bar/stats-bar.component.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { StatsBarComponent } from './stats-bar.component';
import { PlumeService } from '../../../core/services/plume.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockPlumeService } from '../../../core/services/mock-plume.service';
import { of } from 'rxjs';

describe('StatsBarComponent', () => {
  let fixture: ComponentFixture<StatsBarComponent>;
  let service: PlumeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsBarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlumeService, useClass: MockPlumeService },
      ],
    }).compileComponents();
    service = TestBed.inject(PlumeService);
    fixture = TestBed.createComponent(StatsBarComponent);
  });

  it('should render 4 stat items', async () => {
    spyOn(service, 'getStats').and.returnValue(of({
      totalDetections: 1234,
      countriesCount: 42,
      gasTypesCount: 3,
      latestDetectionDate: '2024-01-15T10:00:00',
    }));
    await fixture.whenStable();
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-stat]');
    expect(items.length).toBe(4);
  });

  it('should display total detections label', async () => {
    spyOn(service, 'getStats').and.returnValue(of({
      totalDetections: 1234,
      countriesCount: 42,
      gasTypesCount: 3,
      latestDetectionDate: '2024-01-15T10:00:00',
    }));
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Total Detections');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/stats-bar/stats-bar.component.spec.ts"
```

Expected: FAIL

- [ ] **Step 3: Implement StatsBarComponent**

```typescript
// src/app/features/landing/stats-bar/stats-bar.component.ts
import { Component, OnInit, OnDestroy, ElementRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PlumeService } from '../../../core/services/plume.service';
import { Stats } from '../../../core/models/plume.model';

interface StatItem {
  label: string;
  value: string;
  description: string;
}

@Component({
  selector: 'app-stats-bar',
  templateUrl: './stats-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsBarComponent implements OnInit, OnDestroy {
  private service = inject(PlumeService);
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;

  animated = signal(false);

  private rawStats = toSignal(this.service.getStats());

  get stats(): Stats | undefined {
    return this.rawStats();
  }

  readonly statItems = (): StatItem[] => {
    const s = this.stats;
    if (!s) return [];
    return [
      { label: 'Total Detections', value: s.totalDetections.toLocaleString(), description: 'Satellite plume detections' },
      { label: 'Countries Monitored', value: s.countriesCount.toString(), description: 'Nations with recorded events' },
      { label: 'Gas Types', value: s.gasTypesCount.toString(), description: 'CH₄, CO, NO₂' },
      { label: 'Latest Detection', value: new Date(s.latestDetectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), description: 'Most recent satellite pass' },
    ];
  };

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          this.animated.set(true);
          this.observer?.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
```

```html
<!-- src/app/features/landing/stats-bar/stats-bar.component.html -->
<section class="bg-slate-900 border-y border-slate-800 py-12 px-6">
  <div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
    @for (item of statItems(); track item.label) {
      <div data-stat class="text-center" [class.animate-in]="animated()">
        <div class="text-3xl md:text-4xl font-extrabold text-slate-100 mb-1">
          {{ item.value }}
        </div>
        <div class="text-sm font-semibold text-blue-400 mb-0.5">{{ item.label }}</div>
        <div class="text-xs text-slate-500">{{ item.description }}</div>
      </div>
    }
    @if (!stats) {
      @for (i of [1,2,3,4]; track i) {
        <div data-stat class="text-center">
          <div class="h-10 bg-slate-800 rounded animate-pulse mb-2"></div>
          <div class="h-4 bg-slate-800 rounded animate-pulse w-3/4 mx-auto"></div>
        </div>
      }
    }
  </div>
</section>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/stats-bar/stats-bar.component.spec.ts"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd gas-frontend
git add src/app/features/landing/stats-bar/
git commit -m "feat: 实现 Stats Bar 统计数据展示组件"
```

---

## Task 5: Gas Types Component

Three cards displaying CH4, CO, NO2 info. Static content — no service call.

**Files:**
- Modify: `src/app/features/landing/gas-types/gas-types.component.ts`
- Create: `src/app/features/landing/gas-types/gas-types.component.html`

- [ ] **Step 1: Implement GasTypesComponent**

```typescript
// src/app/features/landing/gas-types/gas-types.component.ts
import { Component } from '@angular/core';

interface GasCard {
  type: 'CH4' | 'CO' | 'NO2';
  name: string;
  formula: string;
  color: string;
  borderColor: string;
  description: string;
  sources: string;
}

@Component({
  selector: 'app-gas-types',
  templateUrl: './gas-types.component.html',
})
export class GasTypesComponent {
  readonly gases: GasCard[] = [
    {
      type: 'CH4',
      name: 'Methane',
      formula: 'CH₄',
      color: 'text-orange-400',
      borderColor: 'border-orange-400/30',
      description: 'A potent greenhouse gas with 80× the warming power of CO₂ over 20 years. Primary anthropogenic sources include oil & gas operations and agriculture.',
      sources: 'Oil & Gas · Agriculture · Landfills',
    },
    {
      type: 'CO',
      name: 'Carbon Monoxide',
      formula: 'CO',
      color: 'text-red-400',
      borderColor: 'border-red-400/30',
      description: 'An indirect greenhouse gas and air pollutant produced by incomplete combustion. Indicator of industrial activity and biomass burning.',
      sources: 'Combustion · Biomass Burning · Industry',
    },
    {
      type: 'NO2',
      name: 'Nitrogen Dioxide',
      formula: 'NO₂',
      color: 'text-indigo-400',
      borderColor: 'border-indigo-400/30',
      description: 'A toxic air pollutant linked to respiratory disease and a precursor to smog. Primarily emitted from vehicle exhausts and power plants.',
      sources: 'Transport · Power Plants · Industry',
    },
  ];
}
```

```html
<!-- src/app/features/landing/gas-types/gas-types.component.html -->
<section class="py-20 px-6 bg-slate-950">
  <div class="max-w-5xl mx-auto">
    <h2 class="text-3xl font-bold text-slate-100 text-center mb-4">Monitored Gas Types</h2>
    <p class="text-slate-400 text-center mb-12 max-w-xl mx-auto">
      GasWatch tracks three key atmospheric gases detected by satellite payloads.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      @for (gas of gases; track gas.type) {
        <div class="bg-slate-900 rounded-2xl border p-6 flex flex-col gap-4 hover:border-opacity-60 transition-colors"
             [class]="gas.borderColor">
          <div class="flex items-center gap-3">
            <span class="text-2xl font-mono font-bold" [class]="gas.color">{{ gas.formula }}</span>
            <span class="text-slate-300 font-semibold">{{ gas.name }}</span>
          </div>
          <p class="text-slate-400 text-sm leading-relaxed flex-1">{{ gas.description }}</p>
          <div class="text-xs text-slate-500 border-t border-slate-800 pt-3">
            {{ gas.sources }}
          </div>
        </div>
      }
    </div>
  </div>
</section>
```

- [ ] **Step 2: Run full landing test suite to verify no regressions**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/**/*.spec.ts"
```

Expected: All existing landing tests PASS

- [ ] **Step 3: Commit**

```bash
cd gas-frontend
git add src/app/features/landing/gas-types/
git commit -m "feat: 实现 Gas Types 三种气体卡片组件"
```

---

## Task 6: Latest Detections Component

Grid of 10 most recent plume cards. Each card links to `/map?id=<id>`.

**Files:**
- Modify: `src/app/features/landing/latest-detections/latest-detections.component.ts`
- Create: `src/app/features/landing/latest-detections/latest-detections.component.html`
- Create: `src/app/features/landing/latest-detections/latest-detections.component.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/landing/latest-detections/latest-detections.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { LatestDetectionsComponent } from './latest-detections.component';
import { PlumeService } from '../../../core/services/plume.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Plume } from '../../../core/models/plume.model';
import { DEFAULT_FILTER } from '../../../core/models/plume.model';

const mockPlumes: Plume[] = Array.from({ length: 15 }, (_, i) => ({
  id: `P${i.toString().padStart(3, '0')}`,
  satellite: 'TEST-SAT',
  payload: 'AHSI',
  productLevel: 'L2B',
  overpassTime: new Date(2024, 0, i + 1).toISOString(),
  longitude: 0,
  latitude: 0,
  country: 'Testland',
  sector: 'Oil and Gas',
  gasType: 'CH4',
  fluxRate: 100 + i,
  fluxRateStd: 10,
  windU: 1,
  windV: 1,
  windSpeed: 1.4,
  detectionInstitution: 'Test',
  quantificationInstitution: 'Test',
  feedbackOperator: '',
  feedbackGovernment: '',
  additionalInformation: '',
  sharedOrganization: '',
  geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
}));

describe('LatestDetectionsComponent', () => {
  let fixture: ComponentFixture<LatestDetectionsComponent>;
  let service: PlumeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatestDetectionsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlumeService, useClass: class { getPlumes = () => of(mockPlumes); } as any },
      ],
    }).compileComponents();
    service = TestBed.inject(PlumeService);
    fixture = TestBed.createComponent(LatestDetectionsComponent);
  });

  it('should show at most 10 plume cards', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-plume-card]');
    expect(cards.length).toBeLessThanOrEqual(10);
  });

  it('should show most recent plumes first (sorted by overpassTime desc)', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-plume-card]');
    expect(cards.length).toBeGreaterThan(0);
    // First card should reference most recent plume (index 14 = P014)
    expect(cards[0].textContent).toContain('P014');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/latest-detections/latest-detections.component.spec.ts"
```

Expected: FAIL

- [ ] **Step 3: Implement LatestDetectionsComponent**

```typescript
// src/app/features/landing/latest-detections/latest-detections.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RouterLink } from '@angular/router';
import { PlumeService } from '../../../core/services/plume.service';
import { Plume, GAS_COLORS, DEFAULT_FILTER } from '../../../core/models/plume.model';

@Component({
  selector: 'app-latest-detections',
  imports: [RouterLink],
  templateUrl: './latest-detections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestDetectionsComponent {
  private service = inject(PlumeService);

  readonly plumes = toSignal(
    this.service.getPlumes(DEFAULT_FILTER).pipe(
      map(list =>
        [...list]
          .sort((a, b) => new Date(b.overpassTime).getTime() - new Date(a.overpassTime).getTime())
          .slice(0, 10)
      )
    )
  );

  gasColor(gasType: string): string {
    return GAS_COLORS[gasType as keyof typeof GAS_COLORS] ?? '#94a3b8';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  formatFlux(flux: number): string {
    return flux >= 1000 ? `${(flux / 1000).toFixed(1)}t/h` : `${Math.round(flux)} kg/h`;
  }
}
```

```html
<!-- src/app/features/landing/latest-detections/latest-detections.component.html -->
<section class="py-20 px-6 bg-slate-950">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-slate-100 text-center mb-4">Latest Detections</h2>
    <p class="text-slate-400 text-center mb-12">Most recent satellite-detected emission events</p>

    @if (!plumes()) {
      <!-- Loading skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (i of [1,2,3,4,5,6,7,8]; track i) {
          <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 animate-pulse">
            <div class="h-4 bg-slate-800 rounded mb-2 w-1/3"></div>
            <div class="h-6 bg-slate-800 rounded mb-1"></div>
            <div class="h-4 bg-slate-800 rounded w-2/3"></div>
          </div>
        }
      </div>
    } @else {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        @for (plume of plumes(); track plume.id) {
          <div data-plume-card
               class="bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-600 p-4 flex flex-col gap-2 transition-colors group">
            <!-- Gas badge + ID -->
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                    [style.background]="gasColor(plume.gasType) + '22'"
                    [style.color]="gasColor(plume.gasType)">
                {{ plume.gasType }}
              </span>
              <span class="text-xs text-slate-500 font-mono">{{ plume.id }}</span>
            </div>
            <!-- Country + Sector -->
            <div class="text-sm font-semibold text-slate-200">{{ plume.country }}</div>
            <div class="text-xs text-slate-500">{{ plume.sector }}</div>
            <!-- Flux -->
            <div class="text-sm text-slate-300">
              <span class="font-mono text-slate-100">{{ formatFlux(plume.fluxRate) }}</span>
              flux rate
            </div>
            <!-- Satellite + Date -->
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-slate-800 text-xs text-slate-500">
              <span>{{ plume.satellite }}</span>
              <span>{{ formatDate(plume.overpassTime) }}</span>
            </div>
            <!-- View on Map link -->
            <a [routerLink]="['/map']" [queryParams]="{ id: plume.id }"
               class="text-xs text-blue-400 hover:text-blue-300 transition-colors text-right group-hover:underline">
              View on Map →
            </a>
          </div>
        }
      </div>
    }
  </div>
</section>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/latest-detections/latest-detections.component.spec.ts"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd gas-frontend
git add src/app/features/landing/latest-detections/
git commit -m "feat: 实现 Latest Detections 最新探测数据网格"
```

---

## Task 7: About Component

**Files:**
- Modify: `src/app/features/landing/about/about.component.ts`
- Create: `src/app/features/landing/about/about.component.html`

- [ ] **Step 1: Implement AboutComponent**

```typescript
// src/app/features/landing/about/about.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
})
export class AboutComponent {}
```

```html
<!-- src/app/features/landing/about/about.component.html -->
<section id="about" class="py-20 px-6 bg-slate-900 border-t border-slate-800">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-3xl font-bold text-slate-100 mb-6">Our Mission</h2>
    <p class="text-slate-400 text-lg leading-relaxed mb-8">
      GasWatch provides transparent access to satellite-detected greenhouse gas emission data.
      By making plume monitoring data publicly accessible, we empower researchers, policymakers,
      and citizens to hold polluters accountable and track progress toward emissions reduction targets.
    </p>
    <div class="bg-slate-800 rounded-2xl border border-slate-700 p-6 text-left">
      <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Data Attribution</h3>
      <p class="text-slate-300 text-sm leading-relaxed">
        Emission plume data sourced from
        <span class="text-blue-400 font-medium">SITP — Shanghai Institute of Technical Physics,
        Chinese Academy of Sciences</span>. Detected via the GAOFEN-5-01A satellite AHSI payload.
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Run full landing suite**

```bash
cd gas-frontend && ng test --include="src/app/features/landing/**/*.spec.ts"
```

Expected: All PASS

- [ ] **Step 3: Commit**

```bash
cd gas-frontend
git add src/app/features/landing/about/
git commit -m "feat: 完成 Landing 页面所有子组件（About）"
```

---

## Task 8: Map Component — MapLibre Init + Basemap

**Files:**
- Modify: `src/app/features/map/map.component.ts`
- Create: `src/app/features/map/map.component.html`
- Create: `src/app/features/map/map.component.spec.ts`

MapLibre GL requires WebGL and cannot run in jsdom. Tests mock the MapLibre import.

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/map/map.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { PlumeService } from '../../core/services/plume.service';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

// Mock maplibre-gl
vi.mock('maplibre-gl', () => ({
  default: {
    Map: class {
      on = vi.fn();
      remove = vi.fn();
      addSource = vi.fn();
      addLayer = vi.fn();
      getSource = vi.fn();
      flyTo = vi.fn();
    },
  },
}));

describe('MapComponent', () => {
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PlumeService, useClass: class { getPlumes = () => of([]); } as any },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(new Map()) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MapComponent);
  });

  it('should create map component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nav bar with Home link', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a[routerLink="/"]')).toBeTruthy();
    expect(el.textContent).toContain('GasWatch');
  });

  it('should render map container div', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#map-container')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd gas-frontend && ng test --include="src/app/features/map/map.component.spec.ts"
```

Expected: FAIL

- [ ] **Step 3: Implement MapComponent**

```typescript
// src/app/features/map/map.component.ts
import {
  Component, OnInit, OnDestroy, inject, signal, computed,
  ChangeDetectionStrategy, ElementRef, viewChild, afterNextRender
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, Subject, takeUntil } from 'rxjs';
import maplibregl, { Map as MapLibreMap, MapMouseEvent, GeoJSONSource } from 'maplibre-gl';
import { PlumeService } from '../../core/services/plume.service';
import { Plume, GAS_COLORS, DEFAULT_FILTER, FilterCriteria } from '../../core/models/plume.model';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';
import { DetailDrawerComponent } from './detail-drawer/detail-drawer.component';

const MBTILES_TILEJSON = 'http://localhost:7777/services/vector/tilejson.json';

@Component({
  selector: 'app-map',
  imports: [RouterLink, FilterPanelComponent, DetailDrawerComponent],
  templateUrl: './map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; position: absolute; inset: 0; }
    #map-container { position: absolute; inset: 0; top: 48px; }
    .nav-bar { position: relative; z-index: 10; height: 48px; }
  `],
})
export class MapComponent implements OnInit, OnDestroy {
  private service = inject(PlumeService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  private map?: MapLibreMap;
  readonly mapEl = viewChild<ElementRef>('mapContainer');

  loading = signal(true);
  error = signal<string | null>(null);
  selectedPlume = signal<Plume | null>(null);
  filter = signal<FilterCriteria>(DEFAULT_FILTER);

  private allPlumes = signal<Plume[]>([]);

  constructor() {
    afterNextRender(() => this.initMap());
  }

  ngOnInit(): void {
    // Load plumes when filter changes
    this.service.getPlumes(this.filter()).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        this.error.set('Failed to load data');
        return of([]);
      })
    ).subscribe(plumes => {
      this.allPlumes.set(plumes);
      this.loading.set(false);
      this.updateMapSource(plumes);
    });

    // Handle ?id= query param to pre-select a plume
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.service.getPlumeById(id).pipe(
          takeUntil(this.destroy$),
          catchError(() => of(null))
        ).subscribe(plume => {
          if (plume) {
            this.selectedPlume.set(plume);
            this.map?.flyTo({ center: [plume.longitude, plume.latitude], zoom: 12 });
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
  }

  private initMap(): void {
    const container = document.getElementById('map-container');
    if (!container) return;

    this.map = new maplibregl.Map({
      container: 'map-container',
      style: {
        version: 8,
        sources: {
          basemap: {
            type: 'vector',
            url: MBTILES_TILEJSON,
          },
        },
        layers: this.buildBasemapLayers(),
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: [0, 20],
      zoom: 2,
    });

    this.map.on('load', () => {
      this.addPlumeSource();
      this.addClusterLayers();
      this.addMarkerLayers();
      this.addMapEventHandlers();
    });
  }

  private buildBasemapLayers(): maplibregl.LayerSpecification[] {
    return [
      { id: 'background', type: 'background', paint: { 'background-color': '#0f172a' } },
      { id: 'land', type: 'fill', source: 'basemap', 'source-layer': 'land', paint: { 'fill-color': '#1e293b' } },
      { id: 'water', type: 'fill', source: 'basemap', 'source-layer': 'water', paint: { 'fill-color': '#0f172a' } },
      { id: 'boundaries', type: 'line', source: 'basemap', 'source-layer': 'boundaries', paint: { 'line-color': '#334155', 'line-width': 0.5 } },
      { id: 'roads', type: 'line', source: 'basemap', 'source-layer': 'roads', paint: { 'line-color': '#1e3a5f', 'line-width': 0.5 } },
    ];
  }

  private addPlumeSource(): void {
    if (!this.map) return;
    this.map.addSource('plumes', {
      type: 'geojson',
      data: this.plumesToGeoJSON([]),
      cluster: true,
      clusterMaxZoom: 10,
      clusterRadius: 50,
      clusterProperties: {
        ch4_count: ['+', ['case', ['==', ['get', 'gasType'], 'CH4'], 1, 0]],
        co_count: ['+', ['case', ['==', ['get', 'gasType'], 'CO'], 1, 0]],
      },
    });
  }

  private addClusterLayers(): void {
    if (!this.map) return;
    // Cluster circle
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'plumes',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#fb923c', 5,
          '#f87171', 20,
          '#818cf8',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 18, 5, 25, 20, 35],
        'circle-opacity': 0.85,
      },
    });
    // Cluster count label
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'plumes',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold'],
        'text-size': 12,
      },
      paint: { 'text-color': '#ffffff' },
    });
  }

  private addMarkerLayers(): void {
    if (!this.map) return;
    // Outer glow
    this.map.addLayer({
      id: 'markers-glow',
      type: 'circle',
      source: 'plumes',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 16,
        'circle-color': [
          'match', ['get', 'gasType'],
          'CH4', GAS_COLORS.CH4,
          'CO', GAS_COLORS.CO,
          'NO2', GAS_COLORS.NO2,
          '#94a3b8',
        ],
        'circle-opacity': 0.2,
      },
    });
    // Inner dot
    this.map.addLayer({
      id: 'markers',
      type: 'circle',
      source: 'plumes',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 7,
        'circle-color': [
          'match', ['get', 'gasType'],
          'CH4', GAS_COLORS.CH4,
          'CO', GAS_COLORS.CO,
          'NO2', GAS_COLORS.NO2,
          '#94a3b8',
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#0f172a',
      },
    });
  }

  private addMapEventHandlers(): void {
    if (!this.map) return;
    // Click cluster → zoom in
    this.map.on('click', 'clusters', (e: MapMouseEvent) => {
      const features = this.map!.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features.length) return;
      const clusterId = features[0].properties?.['cluster_id'];
      (this.map!.getSource('plumes') as maplibregl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err || !zoom) return;
          this.map!.flyTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        }
      );
    });

    // Click marker → open detail drawer
    this.map.on('click', 'markers', (e: MapMouseEvent) => {
      const features = this.map!.queryRenderedFeatures(e.point, { layers: ['markers'] });
      if (!features.length) return;
      const plumeId = features[0].properties?.['id'];
      const plume = this.allPlumes().find(p => p.id === plumeId);
      if (plume) this.selectedPlume.set(plume);
    });

    // Pointer cursors
    this.map.on('mouseenter', 'clusters', () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'clusters', () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
    this.map.on('mouseenter', 'markers', () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'markers', () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
  }

  private updateMapSource(plumes: Plume[]): void {
    const source = this.map?.getSource('plumes') as maplibregl.GeoJSONSource | undefined;
    source?.setData(this.plumesToGeoJSON(plumes));
  }

  private plumesToGeoJSON(plumes: Plume[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: plumes.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
        properties: { id: p.id, gasType: p.gasType, fluxRate: p.fluxRate, country: p.country },
      })),
    };
  }

  onFilterChange(newFilter: FilterCriteria): void {
    this.filter.set(newFilter);
    this.loading.set(true);
    this.service.getPlumes(newFilter).pipe(
      takeUntil(this.destroy$),
      catchError(() => {
        this.error.set('Failed to load data');
        return of([]);
      })
    ).subscribe(plumes => {
      this.allPlumes.set(plumes);
      this.loading.set(false);
      this.updateMapSource(plumes);
    });
  }

  closeDrawer(): void {
    this.selectedPlume.set(null);
  }

  dismissError(): void {
    this.error.set(null);
  }
}
```

```html
<!-- src/app/features/map/map.component.html -->
<nav class="nav-bar bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between">
  <span class="text-slate-100 font-bold">GasWatch</span>
  <a routerLink="/" class="text-sm text-slate-400 hover:text-slate-200 transition-colors">← Home</a>
</nav>

<!-- Map container -->
<div id="map-container" #mapContainer></div>

<!-- Loading overlay -->
@if (loading()) {
  <div class="absolute inset-0 top-12 z-20 bg-slate-950/60 flex items-center justify-center pointer-events-none">
    <div class="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-6 py-4">
      <svg class="animate-spin w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <span class="text-slate-300 text-sm">Loading plumes…</span>
    </div>
  </div>
}

<!-- Error toast -->
@if (error()) {
  <div class="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-900/90 border border-red-700 text-red-200 px-5 py-3 rounded-xl flex items-center gap-3">
    <span class="text-sm">{{ error() }}</span>
    <button (click)="dismissError()" class="text-red-400 hover:text-red-200">✕</button>
  </div>
}

<!-- Filter panel (top-left) -->
<div class="absolute top-16 left-4 z-10">
  <app-filter-panel (filterChange)="onFilterChange($event)" />
</div>

<!-- Detail drawer (right edge) -->
<app-detail-drawer
  [plume]="selectedPlume()"
  (close)="closeDrawer()" />
```

- [ ] **Step 4: Create stub sub-components** (so imports compile — full implementations in later tasks)

```typescript
// src/app/features/map/filter-panel/filter-panel.component.ts
import { Component, output } from '@angular/core';
import { FilterCriteria, DEFAULT_FILTER } from '../../../core/models/plume.model';

@Component({
  selector: 'app-filter-panel',
  template: '<div id="filter-panel"></div>',
})
export class FilterPanelComponent {
  readonly filterChange = output<FilterCriteria>();
}
```

```typescript
// src/app/features/map/detail-drawer/detail-drawer.component.ts
import { Component, input, output } from '@angular/core';
import { Plume } from '../../../core/models/plume.model';

@Component({
  selector: 'app-detail-drawer',
  template: '<div id="detail-drawer"></div>',
})
export class DetailDrawerComponent {
  readonly plume = input<Plume | null>(null);
  readonly close = output<void>();
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd gas-frontend && ng test --include="src/app/features/map/map.component.spec.ts"
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd gas-frontend
git add src/app/features/map/
git commit -m "feat: 实现 MapLibre 地图容器（basemap + plume 数据源）"
```

---

## Task 9: Filter Panel Component

Collapsible panel. When expanded: gas type checkboxes, satellite dropdown, date range, flux slider. "Apply" emits `FilterCriteria`.

**Files:**
- Modify: `src/app/features/map/filter-panel/filter-panel.component.ts`
- Create: `src/app/features/map/filter-panel/filter-panel.component.html`
- Create: `src/app/features/map/filter-panel/filter-panel.component.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/map/filter-panel/filter-panel.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { FilterPanelComponent } from './filter-panel.component';
import { FilterCriteria } from '../../../core/models/plume.model';

describe('FilterPanelComponent', () => {
  let fixture: ComponentFixture<FilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FilterPanelComponent);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render collapsed pill by default', () => {
    const el = fixture.nativeElement as HTMLElement;
    const pill = el.querySelector('[data-filter-pill]');
    expect(pill).toBeTruthy();
  });

  it('should expand when pill is clicked', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const pill = el.querySelector<HTMLElement>('[data-filter-pill]');
    pill?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('[data-filter-panel]')).toBeTruthy();
  });

  it('should emit filterChange when Apply is clicked', async () => {
    const emitted: FilterCriteria[] = [];
    fixture.componentInstance.filterChange.subscribe((f: FilterCriteria) => emitted.push(f));

    const el = fixture.nativeElement as HTMLElement;
    // Expand panel
    el.querySelector<HTMLElement>('[data-filter-pill]')?.click();
    fixture.detectChanges();
    // Click Apply
    el.querySelector<HTMLElement>('[data-apply-btn]')?.click();
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(emitted[0]).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd gas-frontend && ng test --include="src/app/features/map/filter-panel/filter-panel.component.spec.ts"
```

Expected: FAIL

- [ ] **Step 3: Implement FilterPanelComponent**

```typescript
// src/app/features/map/filter-panel/filter-panel.component.ts
import { Component, signal, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterCriteria, GasType, DEFAULT_FILTER } from '../../../core/models/plume.model';

@Component({
  selector: 'app-filter-panel',
  imports: [FormsModule],
  templateUrl: './filter-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanelComponent {
  readonly filterChange = output<FilterCriteria>();

  expanded = signal(false);

  // Form state
  selectedGasTypes = signal<Set<GasType>>(new Set());
  dateFrom = signal('');
  dateTo = signal('');
  fluxMin = signal(0);
  fluxMax = signal(100000);

  readonly GAS_TYPES: GasType[] = ['CH4', 'CO', 'NO2'];

  get activeCount(): number {
    let count = 0;
    if (this.selectedGasTypes().size) count++;
    if (this.dateFrom() || this.dateTo()) count++;
    if (this.fluxMin() > 0 || this.fluxMax() < 100000) count++;
    return count;
  }

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  toggleGasType(type: GasType): void {
    const set = new Set(this.selectedGasTypes());
    set.has(type) ? set.delete(type) : set.add(type);
    this.selectedGasTypes.set(set);
  }

  applyFilter(): void {
    const filter: FilterCriteria = {
      ...DEFAULT_FILTER,
      gasTypes: [...this.selectedGasTypes()],
      dateRange: { start: this.dateFrom(), end: this.dateTo() },
      fluxRateRange: { min: this.fluxMin(), max: this.fluxMax() },
    };
    this.filterChange.emit(filter);
    this.expanded.set(false);
  }

  resetFilter(): void {
    this.selectedGasTypes.set(new Set());
    this.dateFrom.set('');
    this.dateTo.set('');
    this.fluxMin.set(0);
    this.fluxMax.set(100000);
    this.filterChange.emit({ ...DEFAULT_FILTER });
  }
}
```

```html
<!-- src/app/features/map/filter-panel/filter-panel.component.html -->
<!-- Collapsed pill -->
@if (!expanded()) {
  <button data-filter-pill
          (click)="toggleExpanded()"
          class="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors shadow-lg">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
      <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
    </svg>
    Filters
    @if (activeCount > 0) {
      <span class="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
        {{ activeCount }}
      </span>
    }
  </button>
}

<!-- Expanded panel -->
@if (expanded()) {
  <div data-filter-panel
       class="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl p-5 w-72 flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <span class="text-slate-200 font-semibold text-sm">Filters</span>
      <button (click)="toggleExpanded()" class="text-slate-500 hover:text-slate-300 text-lg leading-none">✕</button>
    </div>

    <!-- Gas Type -->
    <div>
      <label class="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">Gas Type</label>
      <div class="flex gap-2">
        @for (gas of GAS_TYPES; track gas) {
          <button (click)="toggleGasType(gas)"
                  [class.ring-2]="selectedGasTypes().has(gas)"
                  [class.ring-blue-500]="selectedGasTypes().has(gas)"
                  class="flex-1 py-1.5 text-xs font-bold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300">
            {{ gas }}
          </button>
        }
      </div>
    </div>

    <!-- Date Range -->
    <div>
      <label class="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">Date Range</label>
      <div class="flex flex-col gap-2">
        <input type="date"
               [value]="dateFrom()"
               (input)="dateFrom.set(($event.target as HTMLInputElement).value)"
               class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 w-full" />
        <input type="date"
               [value]="dateTo()"
               (input)="dateTo.set(($event.target as HTMLInputElement).value)"
               class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 w-full" />
      </div>
    </div>

    <!-- Flux Rate -->
    <div>
      <label class="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
        Min Flux Rate: {{ fluxMin().toLocaleString() }} kg/h
      </label>
      <input type="range" min="0" max="10000" step="100"
             [value]="fluxMin()"
             (input)="fluxMin.set(+($event.target as HTMLInputElement).value)"
             class="w-full accent-blue-500" />
    </div>

    <!-- Actions -->
    <div class="flex gap-2 pt-1 border-t border-slate-800">
      <button (click)="resetFilter()"
              class="flex-1 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors">
        Reset
      </button>
      <button data-apply-btn
              (click)="applyFilter()"
              class="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
        Apply
      </button>
    </div>
  </div>
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd gas-frontend && ng test --include="src/app/features/map/filter-panel/filter-panel.component.spec.ts"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd gas-frontend
git add src/app/features/map/filter-panel/
git commit -m "feat: 实现可折叠过滤面板组件"
```

---

## Task 10: Detail Drawer Component

Slide-in drawer from right. On mobile: bottom sheet. Shows all plume fields.

**Files:**
- Modify: `src/app/features/map/detail-drawer/detail-drawer.component.ts`
- Create: `src/app/features/map/detail-drawer/detail-drawer.component.html`
- Create: `src/app/features/map/detail-drawer/detail-drawer.component.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/features/map/detail-drawer/detail-drawer.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { DetailDrawerComponent } from './detail-drawer.component';
import { Plume } from '../../../core/models/plume.model';

const mockPlume: Plume = {
  id: 'A0000092',
  satellite: 'GAOFEN-5-01A',
  payload: 'AHSI',
  productLevel: 'L2B',
  overpassTime: '2023-03-19T20:05:43',
  longitude: -103.58,
  latitude: 31.29,
  country: 'United States of America',
  sector: 'Oil and Gas',
  gasType: 'CH4',
  fluxRate: 1423.84,
  fluxRateStd: 599.16,
  windU: -4.9,
  windV: 5.8,
  windSpeed: 7.59,
  detectionInstitution: 'SITP',
  quantificationInstitution: 'SITP',
  feedbackOperator: '',
  feedbackGovernment: '',
  additionalInformation: '',
  sharedOrganization: '',
  geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
  tiffUrl: 'assets/mock/plumes/A0000092_PLUME.tif',
};

describe('DetailDrawerComponent', () => {
  let fixture: ComponentFixture<DetailDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDrawerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DetailDrawerComponent);
  });

  it('should not render drawer when plume is null', () => {
    fixture.componentRef.setInput('plume', null);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-drawer]')).toBeNull();
  });

  it('should render drawer with plume data when plume is set', async () => {
    fixture.componentRef.setInput('plume', mockPlume);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-drawer]')).toBeTruthy();
    expect(el.textContent).toContain('A0000092');
    expect(el.textContent).toContain('United States of America');
    expect(el.textContent).toContain('1,423.84');
  });

  it('should emit close event when close button clicked', async () => {
    fixture.componentRef.setInput('plume', mockPlume);
    fixture.detectChanges();
    const emitted: void[] = [];
    fixture.componentInstance.close.subscribe(() => emitted.push());
    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-close-btn]');
    closeBtn?.click();
    expect(emitted.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd gas-frontend && ng test --include="src/app/features/map/detail-drawer/detail-drawer.component.spec.ts"
```

Expected: FAIL

- [ ] **Step 3: Implement DetailDrawerComponent**

```typescript
// src/app/features/map/detail-drawer/detail-drawer.component.ts
import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { Plume, GAS_COLORS } from '../../../core/models/plume.model';

interface DetailField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-detail-drawer',
  templateUrl: './detail-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .drawer-slide {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `],
})
export class DetailDrawerComponent {
  readonly plume = input<Plume | null>(null);
  readonly close = output<void>();

  readonly fields = computed<DetailField[]>(() => {
    const p = this.plume();
    if (!p) return [];
    return [
      { label: 'ID', value: p.id },
      { label: 'Satellite', value: p.satellite },
      { label: 'Payload', value: p.payload },
      { label: 'Product Level', value: p.productLevel },
      { label: 'Overpass Time', value: new Date(p.overpassTime).toLocaleString() },
      { label: 'Country', value: p.country },
      { label: 'Sector', value: p.sector },
      { label: 'Longitude', value: p.longitude.toFixed(6) },
      { label: 'Latitude', value: p.latitude.toFixed(6) },
      { label: 'Flux Rate', value: `${p.fluxRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg/h` },
      { label: 'Flux Std Dev', value: `${p.fluxRateStd.toFixed(2)} kg/h` },
      { label: 'Wind Speed', value: `${p.windSpeed.toFixed(2)} m/s` },
      { label: 'Wind U', value: `${p.windU} m/s` },
      { label: 'Wind V', value: `${p.windV} m/s` },
      { label: 'Detection Institution', value: p.detectionInstitution },
      { label: 'Quantification Institution', value: p.quantificationInstitution },
    ].filter(f => f.value && f.value !== '0.00 m/s');
  });

  gasColor(gasType: string): string {
    return GAS_COLORS[gasType as keyof typeof GAS_COLORS] ?? '#94a3b8';
  }
}
```

```html
<!-- src/app/features/map/detail-drawer/detail-drawer.component.html -->
@if (plume()) {
  <!-- Backdrop (mobile only) -->
  <div class="fixed inset-0 bg-black/40 z-20 md:hidden" (click)="close.emit()"></div>

  <!-- Drawer panel -->
  <div data-drawer
       class="drawer-slide fixed z-30
              bottom-0 left-0 right-0 max-h-[70vh]
              md:bottom-auto md:top-12 md:right-0 md:left-auto md:w-96 md:max-h-[calc(100vh-48px)]
              bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 overflow-y-auto flex flex-col">

    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold px-2 py-0.5 rounded-full"
              [style.background]="gasColor(plume()!.gasType) + '22'"
              [style.color]="gasColor(plume()!.gasType)">
          {{ plume()!.gasType }}
        </span>
        <span class="text-slate-200 font-semibold text-sm font-mono">{{ plume()!.id }}</span>
      </div>
      <button data-close-btn
              (click)="close.emit()"
              class="text-slate-500 hover:text-slate-300 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors">
        ✕
      </button>
    </div>

    <!-- Fields -->
    <div class="p-4 flex flex-col gap-1.5 flex-1">
      @for (field of fields(); track field.label) {
        <div class="flex justify-between items-start py-1.5 border-b border-slate-800/50 last:border-0">
          <span class="text-xs text-slate-500 shrink-0 w-40">{{ field.label }}</span>
          <span class="text-xs text-slate-300 text-right font-mono">{{ field.value }}</span>
        </div>
      }
    </div>
  </div>
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd gas-frontend && ng test --include="src/app/features/map/detail-drawer/detail-drawer.component.spec.ts"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd gas-frontend
git add src/app/features/map/detail-drawer/
git commit -m "feat: 实现 Plume 详情抽屉（右侧滑入 / 移动端底部 sheet）"
```

---

## Task 11: Plume Overlay Component — TIFF Heatmap + Polygon

Renders the plume GeoJSON polygon outline and TIFF-derived heatmap on the MapLibre map when a plume is selected.

**Files:**
- Modify: `src/app/features/map/plume-overlay/plume-overlay.component.ts`

This component is not a visual Angular component — it programmatically controls MapLibre layers. It receives the MapLibre map instance and the selected plume via inputs.

- [ ] **Step 1: Implement PlumeOverlayComponent**

```typescript
// src/app/features/map/plume-overlay/plume-overlay.component.ts
import {
  Component, input, effect, ChangeDetectionStrategy, OnDestroy, inject, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Plume } from '../../../core/models/plume.model';
import { GAS_COLORS } from '../../../core/models/plume.model';

const OVERLAY_SOURCE = 'plume-overlay';
const OUTLINE_LAYER = 'plume-outline';
const FILL_LAYER = 'plume-fill';
const HEATMAP_LAYER = 'plume-heatmap';

@Component({
  selector: 'app-plume-overlay',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlumeOverlayComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  readonly map = input<MapLibreMap | null>(null);
  readonly plume = input<Plume | null>(null);

  constructor() {
    effect(() => {
      const map = this.map();
      const plume = this.plume();
      if (!isPlatformBrowser(this.platformId) || !map) return;
      this.clearOverlay(map);
      if (plume) this.renderOverlay(map, plume);
    });
  }

  ngOnDestroy(): void {
    const map = this.map();
    if (map) this.clearOverlay(map);
  }

  private clearOverlay(map: MapLibreMap): void {
    if (map.getLayer(HEATMAP_LAYER)) map.removeLayer(HEATMAP_LAYER);
    if (map.getLayer(OUTLINE_LAYER)) map.removeLayer(OUTLINE_LAYER);
    if (map.getLayer(FILL_LAYER)) map.removeLayer(FILL_LAYER);
    if (map.getSource(OVERLAY_SOURCE)) map.removeSource(OVERLAY_SOURCE);
  }

  private renderOverlay(map: MapLibreMap, plume: Plume): void {
    const color = GAS_COLORS[plume.gasType] ?? '#94a3b8';

    map.addSource(OVERLAY_SOURCE, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: plume.geometry,
        properties: { id: plume.id, gasType: plume.gasType },
      },
    });

    // Transparent fill for hover area
    map.addLayer({
      id: FILL_LAYER,
      type: 'fill',
      source: OVERLAY_SOURCE,
      paint: { 'fill-color': color, 'fill-opacity': 0.08 },
    });

    // Dashed polygon outline
    map.addLayer({
      id: OUTLINE_LAYER,
      type: 'line',
      source: OVERLAY_SOURCE,
      paint: {
        'line-color': color,
        'line-width': 2,
        'line-dasharray': [4, 2],
      },
    });

    // TIFF heatmap (rendered to canvas, added as image source if available)
    if (plume.tiffUrl) {
      this.renderTiffHeatmap(map, plume).catch(err => {
        console.warn('TIFF heatmap failed, showing polygon only:', err);
      });
    }
  }

  private async renderTiffHeatmap(map: MapLibreMap, plume: Plume): Promise<void> {
    const { fromUrl } = await import('geotiff');
    const tiff = await fromUrl(plume.tiffUrl!);
    const image = await tiff.getImage();
    const [r] = await image.readRasters({ interleave: false }) as [Float32Array | Uint16Array];

    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox(); // [west, south, east, north]

    // Render pixel values to canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(width, height);

    // Normalize and colorize (orange gradient for CH4, red for CO, indigo for NO2)
    const colorMap = { CH4: [251, 146, 60], CO: [248, 113, 113], NO2: [129, 140, 248] };
    const [cr, cg, cb] = colorMap[plume.gasType] ?? [148, 163, 184];
    const values = Array.from(r as ArrayLike<number>);
    const max = Math.max(...values.filter(v => v > 0));

    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v <= 0) { imgData.data[i * 4 + 3] = 0; continue; }
      const intensity = Math.min(v / max, 1);
      imgData.data[i * 4 + 0] = cr;
      imgData.data[i * 4 + 1] = cg;
      imgData.data[i * 4 + 2] = cb;
      imgData.data[i * 4 + 3] = Math.round(intensity * 180);
    }
    ctx.putImageData(imgData, 0, 0);

    const imageId = `tiff-${plume.id}`;
    if (!map.hasImage(imageId)) {
      map.addImage(imageId, canvas);
    }

    map.addSource(`${OVERLAY_SOURCE}-tiff`, {
      type: 'image',
      url: canvas.toDataURL(),
      coordinates: [
        [bbox[0], bbox[3]], // NW
        [bbox[2], bbox[3]], // NE
        [bbox[2], bbox[1]], // SE
        [bbox[0], bbox[1]], // SW
      ],
    });

    map.addLayer({
      id: HEATMAP_LAYER,
      type: 'raster',
      source: `${OVERLAY_SOURCE}-tiff`,
      paint: { 'raster-opacity': 0.7, 'raster-fade-duration': 300 },
    });
  }
}
```

- [ ] **Step 2: Wire PlumeOverlayComponent into MapComponent**

In `src/app/features/map/map.component.ts`, add `PlumeOverlayComponent` to imports and use it in the template:

**Add to imports array:**
```typescript
import { PlumeOverlayComponent } from './plume-overlay/plume-overlay.component';
// Add to Component imports: [..., PlumeOverlayComponent]
```

**Add map reference signal to component class:**
```typescript
// In MapComponent class, add:
readonly mapInstance = signal<MapLibreMap | null>(null);
```

**In initMap(), after creating the map, set the signal:**
```typescript
this.map = new maplibregl.Map({ ... });
this.mapInstance.set(this.map);
```

**In map.component.html, add before closing tag:**
```html
<app-plume-overlay [map]="mapInstance()" [plume]="selectedPlume()" />
```

- [ ] **Step 3: Run full map test suite**

```bash
cd gas-frontend && ng test --include="src/app/features/map/**/*.spec.ts"
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
cd gas-frontend
git add src/app/features/map/plume-overlay/ src/app/features/map/map.component.ts src/app/features/map/map.component.html
git commit -m "feat: 实现 Plume 覆盖层（GeoTIFF 热力图 + 多边形轮廓）"
```

---

## Task 12: Final Wiring — Landing Container Imports Update

Now that all sub-components are fully implemented, update the landing component to import the real implementations (replacing the stubs).

**Files:**
- Verify: `src/app/features/landing/landing.component.ts` — imports point to real components, not stubs.

All the components were already stubs-in-place that will be replaced by the real implementations in Tasks 3–7. This task just verifies everything compiles and passes.

- [ ] **Step 1: Run the full test suite**

```bash
cd gas-frontend && ng test
```

Expected: All tests PASS

- [ ] **Step 2: Build to check for compilation errors**

```bash
cd gas-frontend && ng build
```

Expected: Build SUCCESS with no TypeScript errors

- [ ] **Step 3: Start dev server and smoke-test manually**

```bash
cd gas-frontend && ng serve
```

Visit:
- `http://localhost:4200/` — landing page loads, nav shows "GasWatch" + "Open Map →"
- `http://localhost:4200/map` — map loads, mbtileserver tiles shown if running

- [ ] **Step 4: Final commit**

```bash
cd gas-frontend
git add -A
git commit -m "feat: GasWatch 前端 MVP 完成（Landing + Map 全流程）"
```

---

## Self-Review Against Spec

Spec section coverage check:

| Spec Section | Covered by Task |
|---|---|
| §2 Site structure `/` and `/map` routes | Task 1 |
| §3 Visual style (slate dark theme) | All tasks use Tailwind slate classes |
| §4 Architecture — service abstraction, PlumeService DI | Task 1 (app.config.ts) |
| §5 Data models (Plume, FilterCriteria, Stats) | Pre-existing — not recreated |
| §6 Service layer (mock/api) | Pre-existing — not recreated |
| §7 Landing page — all 7 sections | Tasks 2–7 |
| §8.1 Map layout — full-screen, nav, filter, drawer | Task 8 |
| §8.2 Cluster + markers + plume overlay | Tasks 8, 11 |
| §8.3 Filter panel | Task 9 |
| §8.4 Detail drawer (slide-in + mobile bottom sheet) | Task 10 |
| §9 Mock data (20 records, tiffUrl) | Pre-existing — verified 20 records |
| §11 Error handling (toast, loading states) | Task 8 (loading overlay, error toast) |
| §12 Testing (unit tests for service, filter, drawer) | Tasks 4, 6, 9, 10 |
| §13 Component structure | Matches exactly |
| §14 Map tile basemap from mbtileserver | Task 8 |
| §15 Dependencies (MapLibre, GeoTIFF) | Used in Tasks 8, 11 |

**Placeholder scan:** All code blocks are complete. No "TBD", "TODO", or "implement later" strings present.

**Type consistency check:**
- `FilterCriteria` used consistently across FilterPanelComponent, MapComponent, PlumeService
- `Plume` input in DetailDrawerComponent matches `Plume | null` from map.component.ts `selectedPlume`
- `GAS_COLORS` imported from `plume.model.ts` in LatestDetections, DetailDrawer, PlumeOverlay
- `DEFAULT_FILTER` used in LatestDetections and MapComponent consistently

---

Plan complete and saved to `docs/superpowers/plans/2026-04-09-gaswatch-frontend.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
