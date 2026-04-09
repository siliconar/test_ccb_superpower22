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
